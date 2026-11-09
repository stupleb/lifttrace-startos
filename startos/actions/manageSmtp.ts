import { smtpPrefill } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { clearSmtpScript, runInImage } from '../utils'

export const manageSmtp = sdk.Action.withInput(
  'manage-smtp',

  async ({ effects }) => ({
    name: i18n('Configure SMTP'),
    description: i18n(
      "Let LiftTrace send email: password resets, invitations, coaching notices and weekly summaries. While SMTP is set here, LiftTrace's Settings > Email (SMTP) is read-only. LiftTrace restarts to apply it.",
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  sdk.InputSpec.of({ smtp: sdk.inputSpecConstants.smtpInputSpec }),

  async ({ effects }) => ({
    smtp: smtpPrefill(await storeJson.read((s) => s.smtp).once()),
  }),

  async ({ effects, input }) => {
    const before = await storeJson.read((s) => s.smtp.selection).once()
    await storeJson.merge(effects, { smtp: input.smtp })
    if (input.smtp.selection === 'disabled' && before !== 'disabled') {
      await runInImage(effects, 'manage-smtp', clearSmtpScript)
    }
  },
)
