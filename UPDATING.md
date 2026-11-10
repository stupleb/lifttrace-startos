# Updating the upstream version

Upstream is the LiftTrace image `ghcr.io/traceapps/lifttrace`, pinned in `startos/manifest/index.ts` (`images.lifttrace.source.dockerTag`). Upstream publishes only two image tags, `latest` (built from `main`, which carries the stable releases) and `dev`, so the pin is `latest` plus the digest of the build that matches the release.

## Determining the upstream version

The latest stable release is the newest GitHub release that is not a pre-release; the `vX.Y.Z-devNN` tags are pre-releases and are never packaged.

```bash
gh release list -R TraceApps/lifttrace --exclude-pre-releases --limit 1
```

## Applying the bump

1. Read the current `latest` index digest and the commit it was built from:

   ```bash
   docker buildx imagetools inspect ghcr.io/traceapps/lifttrace:latest --format '{{.Manifest.Digest}}'
   docker buildx imagetools inspect ghcr.io/traceapps/lifttrace:latest --format '{{json .Image}}' \
     | jq -r '.["linux/amd64"].config.Labels["org.opencontainers.image.revision"]'
   ```

2. Confirm that commit is the release. It must be the release tag's commit, or a later `main` commit whose diff from the tag touches no runtime code:

   ```bash
   gh api repos/TraceApps/lifttrace/compare/vX.Y.Z...<revision> --jq '.files[].filename'
   ```

   If `main` has moved on to code that is not in the release, wait for the next release rather than pinning it.

3. Set `dockerTag` to `ghcr.io/traceapps/lifttrace:latest@sha256:<index digest>`. Use the index (manifest list) digest, not a per-architecture one, so both `x86_64` and `aarch64` resolve.

4. Check that every variable `startos/main.ts` sets still exists with the same meaning: grep upstream's `server/` for each name (the `SMTP_*` names sit in a map in `server/email.js`, not after `process.env.`), and read its environment reference, `docs/lifttrace/env-vars.md` in `TraceApps/docs`. A renamed variable is ignored without an error.

5. Check what the scripts in `startos/utils.ts` import from the image (upstream's `server/` is the image's `/app`), since a change there breaks an action when it runs, not when it builds:

   - `setAdminScript`: `server/db.js` (default export), `bcryptjs`, `claimAnonymousData` in `server/lib/claim-anonymous-data.js`, and the `users` columns `username`, `password_hash` and `role`.
   - `listLibrariesScript` and `setLibrariesScript`: `listSourceStatus`, `importSource` and `clearSource` in `server/exercise-sources/index.js`, and its source ids, which must match `exerciseSources`.
   - `clearSmtpScript`: the `app_config` keys `server/email.js` seeds from the `SMTP_*` variables, and `smtp_env_locked`.
   - `applyRegionalScript`: the `user_settings` columns `user_id`, `key`, `value` and `field_times`, and the values LiftTrace stores for `weightUnit`, `heightUnit`, `dateFormat` and `timeFormat` (`src/stores/settings.js` and `src/components/settings/SettingsUnits.svelte`), which `regionalSettings` and `liftTraceRegional` must match.
