export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting LiftTrace!': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,
  'Generated secrets are missing from store.json': 36,

  // interfaces.ts
  'Web UI': 4,
  'The LiftTrace web app and API. The Android and Wear OS apps connect here too.': 5,

  // actions/setAdminPassword.ts
  'Set Admin Password': 6,
  'Create the LiftTrace admin account, or give it a new random password.': 7,
  'Replaces the current admin password.': 8,
  'LiftTrace Admin': 9,
  'Sign in to LiftTrace with these credentials.': 10,
  Username: 11,
  Password: 12,

  // init/watchAdminPassword.ts
  'Create the LiftTrace admin account so you can sign in for the first time.': 13,

  // actions/setPrimaryUrl.ts
  'Set Primary URL': 14,
  'Choose the address LiftTrace puts in its links: invitations, password resets, coaching notices and weekly summaries. A running LiftTrace restarts to apply it.': 15,
  'Primary URL': 16,
  'Pick an address everyone who gets a link can reach. Until you pick one, LiftTrace uses a public domain if this interface has one, otherwise its .local address.': 17,

  // actions/manageSmtp.ts
  'Configure SMTP': 18,
  "Let LiftTrace send email: password resets, invitations, coaching notices and weekly summaries. While SMTP is set here, LiftTrace's Settings > Email (SMTP) is read-only. LiftTrace restarts to apply it.": 19,

  // actions/setApiAccess.ts
  Access: 20,
  'What a client can do with an API token that holds the matching mcp:read, mcp:write or mcp:destroy scope. Deleting workouts applies to MCP only; the REST API has no such route.': 21,
  Off: 22,
  Read: 23,
  'Read and log': 24,
  'Read, log and delete': 25,
  'Configure API Access': 26,
  'Turn on the MCP endpoint (/api/mcp) for AI assistants and the personal REST API (/api/v1) for your own scripts. Each client also needs an API token an admin creates in Settings > API Tokens. LiftTrace restarts to apply it.': 27,

  // actions/setExerciseLibraries.ts
  Libraries: 28,
  'Ticked libraries are downloaded into the shared exercise library; unticked ones are removed from it.': 29,
  'Free Exercise DB: about 870 exercises with photos, public domain': 30,
  'wger: about 950 exercises, few images, CC BY-SA 4.0': 31,
  'ExerciseDB (open source): about 1,500 exercises with animations, AGPL-3.0, from a community server': 32,
  'Choose Exercise Libraries': 33,
  'Choose which public exercise catalogs fill the exercise library every LiftTrace account picks from. Exercises people create themselves are never touched.': 34,
  'A removed library disappears from exercise lists and pickers. Workouts already logged keep their exercises, and adding the library back restores the same entries.': 35,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
