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
