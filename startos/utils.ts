import { T, utils } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 3002
export const uiHostId = 'ui-multi'
export const uiInterfaceId = 'ui'
export const adminUsername = 'admin'
export const dbPath = '/data/db/lifttrace.db'
export const rootCaPath = '/usr/local/share/startos-root-ca.crt'
export const exerciseSources = ['free-db', 'wger', 'exercisedb-oss'] as const

export const randomString = (len: number) =>
  utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len })

export const dbMount = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'db',
  mountpoint: '/data/db',
  readonly: false,
})

export const runInImage = (
  effects: T.Effects,
  name: string,
  script: string,
  env: Record<string, string> = {},
) =>
  sdk.SubContainer.withTemp(
    effects,
    { imageId: 'lifttrace' },
    dbMount,
    name,
    (sub) =>
      sub.execFail(['node', '--input-type=module', '-e', script], {
        cwd: '/app',
        env: { DB_PATH: dbPath, LOG_LEVEL: 'warn', ...env },
        timeout: 300_000,
      }),
  )

// Importing the image's db.js creates or migrates the schema, so this works before LiftTrace has ever started.
export const setAdminScript = `
import bcrypt from 'bcryptjs'
import db from './db.js'
import { claimAnonymousData } from './lib/claim-anonymous-data.js'
const { ADMIN_USERNAME: username, ADMIN_PASSWORD: password } = process.env
const hash = bcrypt.hashSync(password, 12)
const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
if (user) {
  db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(hash, user.id)
} else {
  const first = !db.prepare('SELECT 1 FROM users LIMIT 1').get()
  const { lastInsertRowid } = db
    .prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')")
    .run(username, hash)
  if (first) claimAnonymousData(lastInsertRowid)
}
db.close()
`

export const listLibrariesScript = `
import { listSourceStatus } from './exercise-sources/index.js'
const offered = ${JSON.stringify(exerciseSources)}
console.log(JSON.stringify(listSourceStatus().filter((s) => s.count > 0 && offered.includes(s.id)).map((s) => s.id)))
`

// Clearing soft-deletes, so workouts keep their exercises and a later import brings the same rows back.
export const setLibrariesScript = `
import { clearSource, importSource, listSourceStatus } from './exercise-sources/index.js'
const wanted = JSON.parse(process.env.SOURCES)
const offered = ${JSON.stringify(exerciseSources)}
const failed = []
for (const { id, count } of listSourceStatus()) {
  if (!offered.includes(id)) continue
  if (!wanted.includes(id) && count > 0) clearSource(id)
  if (wanted.includes(id) && count === 0) {
    try {
      if (!(await importSource(id))) failed.push(id + ': nothing downloaded')
    } catch (e) {
      failed.push(id + ': ' + e.message)
    }
  }
}
if (failed.length) {
  console.error(failed.join('; '))
  process.exit(1)
}
`

// LiftTrace keeps env-seeded SMTP settings after the env is gone, and would go on sending through them.
export const clearSmtpScript = `
import db from './db.js'
db.prepare("DELETE FROM app_config WHERE key IN ('smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_env_locked')").run()
db.close()
`

// LiftTrace's own setting values (src/stores/settings.js); an account shows these until it has chosen.
export const liftTraceRegional = {
  units: 'imperial',
  dateFormat: 'US',
  timeFormat: '12h',
} as const

export const regionalSettings = (r: {
  units: 'metric' | 'imperial'
  dateFormat: 'US' | 'EU' | 'ISO'
  timeFormat: '12h' | '24h'
}) => ({
  weightUnit: r.units === 'metric' ? 'kg' : 'lbs',
  heightUnit: r.units === 'metric' ? 'cm' : 'ft',
  dateFormat: r.dateFormat,
  timeFormat: r.timeFormat,
})

// Restoring a LiftTrace backup re-inserts users with their original created_at, so the trigger leaves restored accounts alone.
export const regionalTriggerScript = `
try {
// Dropped before db.js migrates: SQLite 3.45 refuses to rename a table while a trigger names one that is missing.
const { default: Database } = await import('better-sqlite3')
const raw = new Database(process.env.DB_PATH)
raw.exec('DROP TRIGGER IF EXISTS startos_regional_defaults')
raw.close()
const { default: db } = await import('./db.js')
const sql = (s) => "'" + String(s).replaceAll("'", "''") + "'"
const has = (table, cols) => cols.every((c) => db.prepare('PRAGMA table_info(' + table + ')').all().some((r) => r.name === c))
if (process.env.SETTINGS) {
  if (!has('users', ['id', 'created_at']) || !has('user_settings', ['user_id', 'key', 'value', 'updated_at']))
    throw new Error('the users or user_settings columns it needs have changed')
  const inserts = Object.entries(JSON.parse(process.env.SETTINGS)).map(([key, value]) =>
    \`INSERT OR IGNORE INTO user_settings (user_id, key, value, updated_at) VALUES (NEW.id, \${sql(key)}, \${sql(JSON.stringify(value))}, datetime('now'));\`)
  db.exec(\`CREATE TRIGGER startos_regional_defaults AFTER INSERT ON users
    WHEN julianday(NEW.created_at) >= julianday('now', '-1 minute')
    BEGIN \${inserts.join(' ')} END\`)
}
db.close()
console.log(process.env.SETTINGS ? 'Regional defaults: set for new accounts' : 'Regional defaults: off')
} catch (e) {
  if (!process.env.BEST_EFFORT) throw e
  console.error(\`Regional defaults not applied: \${e.message}\`)
}
`
