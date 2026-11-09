import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const inputSpec = sdk.InputSpec.of({
  level: sdk.Value.select({
    name: i18n('Access'),
    description: i18n(
      'What a client can do with an API token that holds the matching mcp:read, mcp:write or mcp:destroy scope. Deleting workouts applies to MCP only; the REST API has no such route.',
    ),
    default: 'off',
    values: {
      off: i18n('Off'),
      read: i18n('Read'),
      write: i18n('Read and log'),
      full: i18n('Read, log and delete'),
    },
  }),
})

export const setApiAccess = sdk.Action.withInput(
  'set-api-access',

  async ({ effects }) => ({
    name: i18n('Configure API Access'),
    description: i18n(
      'Turn on the MCP endpoint (/api/mcp) for AI assistants and the personal REST API (/api/v1) for your own scripts. Each client also needs an API token an admin creates in Settings > API Tokens. LiftTrace restarts to apply it.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({
    level: (await storeJson.read((s) => s.apiAccess).once()) ?? undefined,
  }),

  async ({ effects, input }) =>
    storeJson.merge(effects, { apiAccess: input.level }),
)
