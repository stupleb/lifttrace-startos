import { setAdminPassword } from '../actions/setAdminPassword'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const watchAdminPassword = sdk.setupOnInit(async (effects) => {
  if (!(await storeJson.read((s) => s.adminPassword).const(effects))) {
    await sdk.action.createOwnTask(effects, setAdminPassword, 'critical', {
      reason: i18n(
        'Create the LiftTrace admin account so you can sign in for the first time.',
      ),
    })
  }
})
