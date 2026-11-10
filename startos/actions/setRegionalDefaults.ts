import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  applyRegionalScript,
  liftTraceRegional,
  regionalSettings,
  runInImage,
} from '../utils'

const inputSpec = sdk.InputSpec.of({
  fill: sdk.Value.toggle({
    name: i18n('Apply to accounts without their own settings'),
    description: i18n(
      "When on, LiftTrace fills these in now for every account that hasn't set them itself, and for new accounts each time it starts. Turn off to stop; settings already filled in stay as they are.",
    ),
    default: true,
  }),
  units: sdk.Value.select({
    name: i18n('Units'),
    description: i18n('For body weight, height and cardio distance.'),
    default: liftTraceRegional.units,
    values: {
      metric: i18n('Metric (kg, cm, km)'),
      imperial: i18n('Imperial (lb, ft/in, mi)'),
    },
  }),
  dateFormat: sdk.Value.select({
    name: i18n('Date format'),
    description: null,
    default: liftTraceRegional.dateFormat,
    values: {
      ISO: 'YYYY-MM-DD',
      EU: 'DD/MM/YYYY',
      US: 'MM/DD/YYYY',
    },
  }),
  timeFormat: sdk.Value.select({
    name: i18n('Time format'),
    description: null,
    default: liftTraceRegional.timeFormat,
    values: {
      '24h': i18n('24-hour'),
      '12h': i18n('12-hour'),
    },
  }),
})

export const setRegionalDefaults = sdk.Action.withInput(
  'set-regional-defaults',

  async ({ effects }) => ({
    name: i18n('Set Regional Defaults'),
    description: i18n(
      'Choose the units and the date and time formats that LiftTrace accounts start with. It fills them in for every account that has not chosen them, now and each time LiftTrace starts, and never changes a choice someone has made.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) =>
    (await storeJson.read((s) => s.regionalDefaults).once()) ?? {
      fill: true,
      ...liftTraceRegional,
    },

  async ({ effects, input: { fill, ...defaults } }) => {
    const previous = await storeJson.read((s) => s.regionalDefaults).once()
    // Turned off, the last choice is kept, so turning it back on can still move the accounts it filled in.
    if (!fill) {
      await storeJson.merge(effects, {
        regionalDefaults: { ...(previous ?? liftTraceRegional), fill: false },
      })
      return {
        version: '1',
        title: i18n('Regional Defaults Turned Off'),
        message: i18n(
          'LiftTrace no longer fills in regional defaults. Settings already filled in stay as they are.',
        ),
        result: null,
      }
    }
    const { stdout } = await runInImage(
      effects,
      'set-regional-defaults',
      applyRegionalScript,
      {
        SETTINGS: JSON.stringify(regionalSettings(defaults)),
        PREVIOUS: JSON.stringify(previous ? regionalSettings(previous) : {}),
      },
    )
    await storeJson.merge(effects, {
      regionalDefaults: { ...defaults, fill: true },
    })

    return {
      version: '1',
      title: i18n('Regional Defaults Saved'),
      message: i18n(
        'LiftTrace filled in ${count} settings for accounts that had not chosen them. Accounts created later get them the next time LiftTrace starts.',
        {
          count: Number(
            String(stdout).match(/(\d+) settings filled in/)?.[1] ?? 0,
          ),
        },
      ),
      result: null,
    }
  },
)
