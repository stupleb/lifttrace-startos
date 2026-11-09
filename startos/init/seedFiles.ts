import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { randomString } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind === 'install') {
    await storeJson.merge(effects, {
      jwtSecret: randomString(64),
      tokenEncKey: randomString(64),
      smtp: { selection: 'disabled', value: {} },
    })
  } else {
    await storeJson.merge(effects, {})
  }
})
