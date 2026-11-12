<p align="center">
  <img src="icon.webp" alt="LiftTrace Logo" width="21%">
</p>

# LiftTrace on StartOS

> Everything not listed in this document should behave the same as upstream LiftTrace.
> If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section of
> `instructions.md` for links.

[LiftTrace](https://github.com/TraceApps/lifttrace) is a self-hosted strength-training log: workouts, programs, an exercise catalog, statistics, coaching between accounts and a music player, served as one Node.js process with an embedded SQLite database. This package runs the upstream image unchanged, creates the admin account itself, fills the exercise catalog, and sets from StartOS actions the settings upstream reads from the environment: email, the address in its links and API access.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The package runs upstream's own image, unmodified, through its own entrypoint.

| Item          | Value                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Image         | `ghcr.io/traceapps/lifttrace`, pinned by digest (upstream publishes no per-version tags)              |
| Architectures | x86_64, aarch64                                                                                       |
| Entrypoint    | Upstream's (`docker-entrypoint.sh`, then `node index.js` in `/app`), run as root as upstream ships it |

Subcontainers:

- `lifttrace` — the LiftTrace server (web app, API and scheduler). Attach with `start-cli package attach lifttrace -n lifttrace`. While **Set Regional Defaults** is on, its `regional-defaults` oneshot re-creates the trigger here before the server starts.
- `set-admin-password` — a short-lived container the **Set Admin Password** action starts from the same image; it exists only while the action runs.
- `exercise-libraries` — the same, for **Choose Exercise Libraries**, started both to fill in its form and to apply it.
- `manage-smtp` — the same, for **Configure SMTP** when it switches to **Disabled**.
- `set-regional-defaults` — the same, for **Set Regional Defaults**.

## Volume and Data Layout

Two volumes: `main` holds LiftTrace's data, and `startos` holds the package's own state and is mounted into no container.

| Volume    | Subpath    | Mount point     | Contents                                                                                                                 |
| --------- | ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `main`    | `db/`      | `/data/db`      | `lifttrace.db`, the SQLite database (WAL mode): every account, workout, program, exercise and setting                    |
| `main`    | `uploads/` | `/data/uploads` | uploaded images and set videos (exercise pictures, avatars; progress photos under `body-stats/`)                         |
| `main`    | `backups/` | `/data/backups` | archives written by LiftTrace's own **Settings > Backup & Restore**, manual or scheduled (scheduling is off by default)  |
| `startos` | —          | not mounted     | `store.json`                                                                                                             |

LiftTrace migrates its own schema at startup. Catalog exercises store their picture as a remote URL, so the browser loads them from the catalog's host and they take no space here.

## File Models

The package writes no LiftTrace configuration file: upstream configures itself from environment variables and keeps everything else in its database, where its Settings pages edit it.

`store.json` on the `startos` volume holds the package's state:

| Key                 | Seeded                                                          | Rewritten by                     |
| ------------------- | --------------------------------------------------------------- | -------------------------------- |
| `jwtSecret`         | random, at install                                              | never                            |
| `tokenEncKey`       | random, at install                                              | never                            |
| `adminPassword`     | empty until **Set Admin Password** runs                         | **Set Admin Password**, every run |
| `primaryUrl`        | empty                                                           | **Set Primary URL**              |
| `smtp`              | `disabled`                                                      | **Configure SMTP**               |
| `apiAccess`         | `off` (`off`, `read`, `write`, `full`)                          | **Configure API Access**         |
| `exerciseLibraries` | `["free-db"]` (any of `free-db`, `wger`, `exercisedb-oss`)      | **Choose Exercise Libraries**    |
| `regionalDefaults`  | `null` until **Set Regional Defaults** is saved; then `fill`, `units`, `dateFormat`, `timeFormat` | **Set Regional Defaults** |

`adminPassword` is the last password the action set. If the password is changed inside LiftTrace, the stored copy is stale; the action is the way to get a known one back.

A hand edit survives. An edit to a key that feeds an environment variable restarts LiftTrace with the new value, except `exerciseLibraries`, which is read at each start without causing one. `regionalDefaults` is also read at each start, by the `regional-defaults` oneshot, without causing one; an edit to `adminPassword` changes only what the task checks, not the account. A value that fails validation is replaced by its default at the next write. Changing `jwtSecret` signs everyone out, and changing `tokenEncKey` makes stored OIDC client secrets and webhook signing secrets unreadable.

Environment variables the package sets on every start. LiftTrace reads all of them at each launch:

| Variable                                                                       | Value                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                                                         | `3002`                                                                                                                                                                                                                                                                            |
| `DB_PATH`                                                                      | `/data/db/lifttrace.db`                                                                                                                                                                                                                                                           |
| `UPLOADS_PATH`                                                                 | `/data/uploads`                                                                                                                                                                                                                                                                   |
| `BACKUPS_PATH`                                                                 | `/data/backups`                                                                                                                                                                                                                                                                   |
| `JWT_SECRET`                                                                   | `jwtSecret` — signs sessions; changing it signs everyone out                                                                                                                                                                                                                      |
| `TOKEN_ENC_KEY`                                                                | `tokenEncKey` — encrypts stored OIDC client secrets and webhook signing secrets; changing it makes them unreadable                                                                                                                                                                            |
| `UPDATE_CHECK`                                                                 | `off` — no update checks against GitHub, whatever **Settings > Updates** says                                                                                                                                                                                                     |
| `NODE_EXTRA_CA_CERTS`                                                          | this server's root CA, written into the container at each start                                                                                                                                                                                                                   |
| `PUBLIC_URL`                                                                   | the address chosen with **Set Primary URL**, followed to its current port; until one is chosen, a public HTTPS domain of the `ui` interface, else its `.local` address. Used only in the links LiftTrace emails or shows for copying                                              |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | from **Configure SMTP**: the system SMTP server or a custom one; `SMTP_SECURE` is `true` for TLS and `false` for STARTTLS. Unset while SMTP is disabled or no system SMTP server is set up                                                                                                                          |
| `WEBHOOKS_ENABLED`, `ALLOW_PRIVATE_WEBHOOK_URLS`                               | `true`: an admin's webhooks are delivered, including to LAN and loopback addresses                                                                                                                                                                                                |
| `MCP_ENABLED`, `PUBLIC_API_ENABLED`                                            | `true` unless **Configure API Access** is `off`                                                                                                                                                                                                                                   |
| `MCP_WRITE_ENABLED`, `PUBLIC_API_WRITE_ENABLED`                                | `true` at `write` and `full`                                                                                                                                                                                                                                                      |
| `MCP_DESTROY_ENABLED`                                                          | `true` at `full`                                                                                                                                                                                                                                                                  |
| `EXERCISE_SOURCES`                                                             | `exerciseLibraries`, comma-separated. LiftTrace imports them at startup only while its catalog holds fewer than 10 exercises, so this seeds a new install and retries a download that failed for want of internet; **Choose Exercise Libraries** handles every later change |

Upstream variables the package leaves unset: `INSECURE_COOKIES` (StartOS serves HTTPS, so sign-in cookies stay `Secure`), `RECOVERY_TOKEN` (the login-page recovery that deletes every account stays disabled), `BASE_URL`, `ALLOWED_ORIGINS` (browser-based MCP clients are refused; desktop clients send no `Origin` and pass), `ALLOW_PRIVATE_RADIO_URLS` (an admin may already play internet-radio stations on the LAN, and music servers are open to every account), `EXERCISEDB_OSS_URL`, and every `AI_*`, `OIDC_*`, `BACKUP_*` and `MAX_SESSION_HOURS` variable. LiftTrace's own Settings pages edit what those last ones set, and setting a variable would lock its field; that includes `OIDC_ENABLE_EMAIL_PASSWORD_LOGIN`, whose SSO-only switch is in **Settings > Authentication**.

## Dependencies

None.

## Network Access and Interfaces

One interface, on port 3002.

| Interface id | Type | Port | Protocol | Serves                                                                                                                     |
| ------------ | ---- | ---- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `ui`         | `ui` | 3002 | HTTP     | the web app, the session API the web, Android and Wear OS apps use, the Bearer-token REST API at `/api/v1`, and MCP at `/api/mcp` |

Uploaded images under `/uploads` are served without authentication, as upstream does, except progress photos under `/uploads/body-stats`, which need sign-in; the `backups/` archives are not under that path.

Outbound, LiftTrace reaches the exercise catalogs (raw.githubusercontent.com for the Free Exercise DB, wger.de, oss.exercisedb.dev), and any address a user saves in Settings (music servers, push services, OIDC issuers, NutriTrace, webhooks). For another service on this server, the addresses that work are its LAN address in IP form (`https://<server-ip>:<port>`) and any private or public domain on its interface, which StartOS DNS resolves inside the container: `NODE_EXTRA_CA_CERTS` makes their certificates trusted, while `.local` names do not resolve and fail with `ENOTFOUND`. A certificate error such as `SELF_SIGNED_CERT_IN_CHAIN` means the root CA is missing from the container.

The Android app's release build trusts user-installed CAs, so it works against the StartOS root CA once the phone trusts it. The Wear OS app ships no network security config, so it trusts only system CAs: it should reach LiftTrace only at an address with a publicly issued certificate, i.e. a public domain.

## Installation and First-Run Flow

Upstream opens to a setup wizard in which whoever loads the page first creates the admin account, or skips sign-in entirely, and picks the exercise catalogs to import. On StartOS the wizard is never reached:

1. Install generates `jwtSecret` and `tokenEncKey` and sets `exerciseLibraries` to `["free-db"]`.
2. A critical task holds the service stopped until **Set Admin Password** has run.
3. The action creates the `admin` account (role admin) directly in the database, so the first page anyone loads is a sign-in page. Open registration (`POST /api/auth/register`) is refused from then on.
4. The first start imports the Free Exercise DB in a few seconds. Without internet access the import logs `fetch failed`, LiftTrace starts with an empty catalog, and the next start tries again.

The wizard's other steps (units, body profile) are skipped with it. Each account therefore starts on LiftTrace's own defaults (lbs, ft, MM/DD/YYYY, 12-hour) until it chooses otherwise in **Settings > Language & Region** (height on the **Profile** page), unless it was created while **Set Regional Defaults** was on. The language follows each browser or phone until someone picks one.

## Actions

Six actions, all user-facing; none is hidden.

### Set Admin Password

Creates the `admin` account with a random 32-character password, or gives it a new one, and returns the username and password.

- **When to run it**: once at install (the task asks for it); again when the admin password is lost; and after **Disable User Management** has been used inside LiftTrace, to bring sign-in back.
- **What it changes**: the `admin` row of the `users` table, which it creates if missing and sets to role `admin`; when it creates the first account it also claims data left from single-user mode, as upstream registration does. It then writes `adminPassword` to `store.json`.
- **How**: it runs a short Node script in a temporary container from the LiftTrace image, using the image's own `db.js` and `bcryptjs` against the mounted database. Importing `db.js` migrates the schema first, so it works on a database LiftTrace has never opened.
- **Cost**: a few seconds, without restarting LiftTrace.
- **Repeat safety**: each run replaces the password. Existing sessions are signed tokens that a password change does not revoke, so devices already signed in stay signed in until their session expires.

### Choose Exercise Libraries

A multi-select of the three keyless catalogs: Free Exercise DB (`free-db`), wger (`wger`) and ExerciseDB open source (`exercisedb-oss`). The form opens showing the catalogs that have exercises in the database now, or `exerciseLibraries` while the catalog is empty.

- **What it changes**: it stores the selection as `exerciseLibraries`, then, in a temporary container against the live database, calls upstream's own `importSource` for each ticked catalog that has no exercises and `clearSource` for each unticked one that has. `clearSource` soft-deletes (`deleted_at`), so logged workouts keep their exercise references and a later import restores the same rows. Exercises users created, and catalogs users imported themselves through **Settings > Exercise Catalog** or a JSON file, are not touched; nor is the paid ExerciseDB (RapidAPI) catalog, which needs a key and stays in **Settings > Exercise Catalog**.
- **Failure**: a catalog that cannot be downloaded fails the action with its error (for example `wger: nothing downloaded`), after every other change has been applied. Running it again retries.
- **Cost**: without restarting LiftTrace, and the catalogs appear for every account immediately. The Free Exercise DB and wger take a few seconds each; ExerciseDB, fetched page by page from its community server, took about a minute and a half on the test server.
- **Repeat safety**: a catalog already present is not downloaded again; running it with no change does nothing.

### Set Regional Defaults

Sets the units, date format and time format that new accounts start with, in place of LiftTrace's own (lbs, ft, MM/DD/YYYY, 12-hour). Language is not offered: LiftTrace follows each browser or phone until someone picks one. The choice is stored as `regionalDefaults`, with `fill` false while **Use for new accounts** is off.

- **What it changes**: a SQLite trigger, `startos_regional_defaults`, on LiftTrace's `users` table. When an account is created, it writes that account's `user_settings` rows `weightUnit` (`kg` or `lbs`), `heightUnit` (`cm` or `ft`), `dateFormat` (`ISO`, `EU` or `US`) and `timeFormat` (`24h` or `12h`). Existing accounts are never changed, and each person can change their own settings afterwards. Cardio distances follow the weight unit: km with kg, mi with lbs.
- **When it applies**: to each account created after the action runs, at the moment it is created. The trigger fires only for an account created in the last minute, so restoring a LiftTrace full backup (**Settings > Backup & Restore**), which re-inserts its accounts with their original creation time, keeps their own settings. The `regional-defaults` oneshot removes the trigger before LiftTrace's migrations run and re-creates it after, on every start: a migration can rebuild the `users` table, which drops it, and SQLite refuses some table rebuilds while it exists. If it fails it logs `Regional defaults not applied: …` and LiftTrace starts anyway; the action reports the same failure as an error.
- **Cost**: a few seconds, without restarting LiftTrace. While defaults are set, each start runs the oneshot first, which takes about a second.
- **Turning it off** removes the trigger. Accounts created while it was on keep their settings.
- **Repeat safety**: each run replaces the trigger and the stored choice; accounts created before keep what they started with.
- **Output**: a confirmation.

### Set Primary URL

Chooses the address LiftTrace puts in its links (invitations, password resets, coaching notices, weekly summaries), from the `ui` interface's HTTPS addresses. It is the SDK's primary-URL action: the stored choice becomes `PUBLIC_URL`, followed to the hostname's current port, and is also what StartOS's **Open UI** opens.

- **When to run it**: once email is set up, if the default address is not one everyone who gets a link can reach. Until it has run, `PUBLIC_URL` is a public HTTPS domain of the interface if there is one, otherwise its `.local` address; no task asks for it.
- **Cost**: a running LiftTrace restarts.
- **Repeat safety**: harmless; running it with the same address changes nothing.

### Configure SMTP

The SDK's standard SMTP form: **Disabled**, **System Credentials** (the StartOS system SMTP server, with an optional From address) or **Custom Credentials**. The choice is stored as `smtp` and turned into the `SMTP_*` variables; a change to the system SMTP server restarts LiftTrace with the new values. With **System Credentials** and no SMTP server set up in StartOS's own settings, the variables stay unset.

- **What it changes in LiftTrace**: at each start LiftTrace copies the `SMTP_*` values into its `app_config` table and locks **Settings > Email (SMTP)**, which then shows them read-only. With the variables unset it removes the lock but keeps the values, and would go on sending through them, so switching to **Disabled** also deletes the `smtp_*` rows from `app_config` (in a temporary container, against the live database). Email is then off, and **Settings > Email (SMTP)** is editable and empty. Running **Disabled** again changes nothing, so values entered on that page afterwards are kept.
- **When to run it**: before relying on password resets, coaching notices or weekly summaries, which need email. Without it, an invitation is not sent; LiftTrace shows the invitation link to copy instead. The `admin` account the package creates has no email address, so a password-reset test needs another account or an address added to it.
- **Cost**: LiftTrace restarts.
- **Repeat safety**: each run replaces the whole SMTP choice.

### Configure API Access

One select, `off` by default, that sets the server-side switches for the MCP endpoint (`/api/mcp`) and the personal REST API (`/api/v1/workouts`, `records`, `exercises`, `programs`, `body-stats`):

| Level   | Shown as             | Turns on                                                                                      |
| ------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `off`   | Off                  | nothing; `/api/mcp` and those REST routes answer 404                                          |
| `read`  | Read                 | `MCP_ENABLED`, `PUBLIC_API_ENABLED`                                                           |
| `write` | Read and log         | also `MCP_WRITE_ENABLED`, `PUBLIC_API_WRITE_ENABLED` (log sets, body stats and progress photos) |
| `full`  | Read, log and delete | also `MCP_DESTROY_ENABLED` (MCP's `delete_workout` tool, each call confirmed)                 |

Every request still needs an API token from **Settings > API Tokens** holding the matching `mcp:read`, `mcp:write` or `mcp:destroy` scope.

- **When to run it**: before connecting an AI assistant or a script; turn it back to `off` when nothing uses it.
- **Cost**: LiftTrace restarts.
- **Repeat safety**: each run sets the level outright.

## Tasks

One task, raised at install.

| Task                               | Raised when                              | Severity | Cleared by                     |
| ---------------------------------- | ---------------------------------------- | -------- | ------------------------------ |
| Create the LiftTrace admin account | `adminPassword` in `store.json` is empty | critical | running **Set Admin Password** |

The task is raised at install and does not return once the action has run, including after a restore, which brings `store.json` back with the rest of the backup.

## Health Checks

One check, on the LiftTrace server.

| Check                     | Probes                                                                                                     | Grace period | A failure means                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `primary` (Web Interface) | an HTTP request to `http://127.0.0.1:3002/`, every second while starting and every 30 seconds once healthy | 10 seconds   | the server is not answering. LiftTrace exits at startup if it cannot open or migrate its database, so check the logs for a startup error before anything else. |

LiftTrace logs every request it serves, so the log shows the check's `GET /` every 30 seconds.

## Backups and Restore

Both volumes are copied whole with rsync while the service is stopped, so the SQLite database and its WAL file are captured consistently.

- **Excluded**: `main/backups/`, LiftTrace's own archives, each a database dump plus every uploaded file, which stay on the server but would double the backup's size.
- **Restore** brings back the database, uploads and `store.json`, including the secrets. Sessions and encrypted secrets therefore keep working, and the admin password is the one the action last set.

## Limitations and Differences

What works differently from a LiftTrace installed with upstream's Docker Compose file.

1. Update checks are off and cannot be turned on from **Settings > Updates**; StartOS handles updates.
2. The login-page recovery ("Disable user management") is unavailable because `RECOVERY_TOKEN` is unset. **Set Admin Password** is the recovery path.
3. While **Configure SMTP** sets email, **Settings > Email (SMTP)** is read-only.
4. The exercise catalog starts with the Free Exercise DB instead of the wizard's picker, and the `exercisedb-oss` catalog always comes from `oss.exercisedb.dev` (`EXERCISEDB_OSS_URL` is not offered).
5. Trace AI cannot be pointed at a model through the server (`AI_PROVIDER`, `AI_BASE_URL`). Each user configures it in **Settings > AI Assistant**, where the browser calls the provider.
6. LiftTrace has no instance-wide default for units and date and time formats. **Set Regional Defaults** gives them to accounts created after it runs; accounts that already exist, the `admin` account included, keep their own settings.
7. Reminders, streak alerts and weekly summaries that the server sends (through ntfy, Gotify, Apprise or email) go out at the chosen time in UTC: LiftTrace never saves an account's time zone, and the server falls back to UTC. The Android app's own reminders use the phone's time.
8. Addresses LiftTrace dials itself must not use `.local` names; see [Network Access and Interfaces](#network-access-and-interfaces).
9. The Wear OS app should only connect through a public domain; see [Network Access and Interfaces](#network-access-and-interfaces).

---

## Quick Reference for AI Consumers

The package's operable surface in one block.

```yaml
package_id: lifttrace
image: ghcr.io/traceapps/lifttrace
architectures: [x86_64, aarch64]
subcontainers: [lifttrace, set-admin-password, exercise-libraries, manage-smtp, set-regional-defaults]
volumes:
  main: [/data/db, /data/uploads, /data/backups]
  startos: none
file_models:
  - startos/store.json
startos_managed_env_vars:
  - PORT
  - DB_PATH
  - UPLOADS_PATH
  - BACKUPS_PATH
  - JWT_SECRET
  - TOKEN_ENC_KEY
  - UPDATE_CHECK
  - NODE_EXTRA_CA_CERTS
  - PUBLIC_URL
  - SMTP_HOST
  - SMTP_PORT
  - SMTP_SECURE
  - SMTP_USER
  - SMTP_PASS
  - SMTP_FROM
  - WEBHOOKS_ENABLED
  - ALLOW_PRIVATE_WEBHOOK_URLS
  - MCP_ENABLED
  - MCP_WRITE_ENABLED
  - MCP_DESTROY_ENABLED
  - PUBLIC_API_ENABLED
  - PUBLIC_API_WRITE_ENABLED
  - EXERCISE_SOURCES
dependencies: none
interfaces:
  ui: { type: ui, port: 3002 }
actions:
  - set-admin-password
  - set-exercise-libraries
  - set-regional-defaults
  - set-primary-url
  - manage-smtp
  - set-api-access
tasks:
  - { action: set-admin-password, severity: critical }
health_checks:
  - primary
```
