# LiftTrace

## Documentation

- [LiftTrace guide](https://traceapps.github.io/docs/lifttrace/) ([source](https://github.com/TraceApps/docs/tree/main/docs/lifttrace)) — workouts, programs, the exercise catalog, coaching, statistics, radio, Wear OS, MCP and every Settings section
- [Accounts and sign-in](https://traceapps.github.io/docs/auth/local-users/) ([source](https://github.com/TraceApps/docs/tree/main/docs/auth)) — users, sessions and single sign-on providers such as Pocket ID
- [Integrations](https://traceapps.github.io/docs/integrations/notifications/) ([source](https://github.com/TraceApps/docs/tree/main/docs/integrations)) — ntfy and other notification services, email, and federation with the other Trace apps
- [Trace AI](https://traceapps.github.io/docs/trace/setup/) ([source](https://github.com/TraceApps/docs/tree/main/docs/trace)) — setting up the AI assistant and choosing a model
- [Android app](https://traceapps.github.io/docs/mobile/install/) ([source](https://github.com/TraceApps/docs/tree/main/docs/mobile)) — installing the app and connecting it to your server

## What you get on StartOS

- **Web UI** is the one address LiftTrace has. It serves the web app and the API the Android and Wear OS apps sign in to.
- Sign-in is on from the start. StartOS creates the `admin` account for you, so nobody can claim your server by opening it first.
- The exercise catalog comes filled with the Free Exercise DB. **Choose Exercise Libraries** adds or removes wger and ExerciseDB.
- Email, the address LiftTrace puts in its links, and access for AI assistants are set with StartOS actions.
- Your workouts, programs, photos, accounts and settings are all in StartOS backups. LiftTrace's own backup archives, from **Settings > Backup & Restore**, stay on the server but are left out of StartOS backups.
- LiftTrace doesn't check GitHub for new releases. StartOS updates it.

## Getting set up

1. Run **Set Admin Password** when StartOS asks for it. Copy the username, `admin`, and the password it shows.
2. Start LiftTrace and open the **Web UI**.
3. Sign in as `admin`.
4. Set your units and body profile in **Settings**, so weights and calorie estimates come out right.
5. To give someone else their own log, open **Settings > Users** and invite them, or add them with a username and password yourself. Without email, LiftTrace gives you the invitation link to send them yourself; run **Configure SMTP** to have it emailed.

## Using LiftTrace

### The exercise catalog

LiftTrace downloads the Free Exercise DB, about 870 exercises with photos, the first time it starts. Without internet access then, the catalog starts empty and LiftTrace tries again each time it starts.

Run **Choose Exercise Libraries** to tick or untick the catalogs everyone picks exercises from: the Free Exercise DB, wger (about 950 exercises, few pictures) and ExerciseDB (about 1,500 animated exercises, served by a community server; it takes a minute or two to download). Unticking one hides its exercises from lists and pickers; workouts you've already logged keep them, and ticking it again brings the same entries back. Exercises you've created yourself are never touched.

### The admin password

Run **Set Admin Password** again whenever you need a new admin password, for instance if you've lost it. Browsers and phones already signed in as `admin` stay signed in.

**Settings > Users > Disable User Management** deletes every account along with everything in it, and leaves LiftTrace open to anyone who can reach it. If it has been used, run **Set Admin Password** to turn sign-in back on.

### Email and links

Run **Configure SMTP** to let LiftTrace send password resets, invitations, coaching notices and weekly summaries. Choose **System Credentials** to use the SMTP server StartOS sends its own email with, or **Custom Credentials** to enter another. LiftTrace's **Settings > Email (SMTP)** then shows the settings read-only. Choosing **Disabled** turns email off and clears that page, which you can then fill in yourself instead.

The links in those emails, and the invitation links LiftTrace gives you to copy, point at a public domain of the **Web UI** if it has one, otherwise at its `.local` address, which only works at home. To choose the address yourself, run **Set Primary URL**.

### Android and Wear OS apps

The Android app connects to the **Web UI** address. It only uses HTTPS, so on your home network the phone has to trust your server's root certificate, just as your browser does.

The Wear OS watch app gets its address from the phone when you sign in there, then talks to your server itself. Unlike the phone, it only trusts publicly issued certificates, so it should only work when the phone is signed in through a public domain on the **Web UI**.

### Connecting your other services

LiftTrace can reach other services on this server at the HTTPS addresses StartOS shows for them. Use the address with your server's IP in it, such as `https://192.168.1.10:51454`, or a private or public domain you've added to that service. LiftTrace can't look up `.local` names.

- **Music**: in **Settings > Radio**, pick Subsonic for Navidrome (from the Community Registry), or Jellyfin, Plex or Emby, and enter its address and your sign-in.
- **NutriTrace**: in NutriTrace, create a token in **Settings > API Tokens** with **write:workouts** ticked. In LiftTrace's **Settings > NutriTrace**, paste NutriTrace's **Web UI** address and the token, test it and turn it on. Each finished workout's calories then reach NutriTrace.
- **Notifications**: in **Settings > Notifications**, choose ntfy, Gotify or Apprise and enter its address.
- **Single sign-on**: in **Settings > Authentication**, add Pocket ID or another OpenID Connect provider. For Pocket ID, the issuer is the domain you chose with Pocket ID's **Set Primary URL**. Your `admin` account has no email address, so link it to Pocket ID from your profile in LiftTrace.
- **Webhooks**: in **Settings > Webhooks**, an admin can send finished workouts, personal records, body stats, progress photos and program weeks to Home Assistant, n8n or any other address, on your network or not.

### AI assistants and your own scripts

LiftTrace can answer AI assistants such as Claude Desktop over MCP, at the **Web UI** address followed by `/api/mcp`, and your own scripts over its REST API at `/api/v1`. Both are off until you run **Configure API Access** and choose how much they may do: read, also log sets and body stats, or also delete workouts through MCP. Then create a token in **Settings > API Tokens** with the matching `mcp:` scopes and give it to the assistant or script.

### Connections LiftTrace makes itself

LiftTrace downloads exercise catalogs from GitHub, wger and ExerciseDB, and reaches the music, notification and sign-in services you set up. Those services see your server's IP address. If you publish LiftTrace through a tunnel to keep your home IP private, send its outbound traffic through that tunnel too. If you use a tunnel for another reason, such as a port your router can't forward, there's nothing to change.
