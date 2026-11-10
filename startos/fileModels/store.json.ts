import { FileHelper, smtpShape, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { exerciseSources } from '../utils'

const shape = z.looseObject({
  jwtSecret: z.string().catch(''),
  tokenEncKey: z.string().catch(''),
  adminPassword: z.string().catch(''),
  primaryUrl: z.string().catch(''),
  smtp: smtpShape,
  apiAccess: z.enum(['off', 'read', 'write', 'full']).catch('off'),
  exerciseLibraries: z.array(z.enum(exerciseSources)).catch(['free-db']),
  regionalDefaults: z
    .looseObject({
      fill: z.boolean().catch(true),
      units: z.enum(['metric', 'imperial']),
      dateFormat: z.enum(['US', 'EU', 'ISO']),
      timeFormat: z.enum(['12h', '24h']),
    })
    .nullable()
    .catch(null),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)
