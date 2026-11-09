import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  adminUsername,
  randomString,
  runInImage,
  setAdminScript,
} from '../utils'

export const setAdminPassword = sdk.Action.withoutInput(
  'set-admin-password',

  async ({ effects }) => ({
    name: i18n('Set Admin Password'),
    description: i18n(
      'Create the LiftTrace admin account, or give it a new random password.',
    ),
    warning: (await storeJson.read((s) => s.adminPassword).const(effects))
      ? i18n('Replaces the current admin password.')
      : null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const adminPassword = randomString(32)
    await runInImage(effects, 'set-admin-password', setAdminScript, {
      ADMIN_USERNAME: adminUsername,
      ADMIN_PASSWORD: adminPassword,
    })
    await storeJson.merge(effects, { adminPassword })

    return {
      version: '1',
      title: i18n('LiftTrace Admin'),
      message: i18n('Sign in to LiftTrace with these credentials.'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: adminUsername,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: adminPassword,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
