import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  liftTraceRegional,
  regionalSettings,
  regionalTriggerScript,
  runInImage,
} from '../utils'

const inputSpec = sdk.InputSpec.of({
  fill: sdk.Value.toggle({
    name: i18n('Use for new accounts'),
    description: i18n(
      "When on, every account created from now on starts with these settings. Turn off to give new accounts LiftTrace's own defaults again. Existing accounts are never changed.",
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
      'Choose the units and the date and time formats that new LiftTrace accounts start with. An account gets them the moment it is created; existing accounts keep their settings.',
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
    await runInImage(
      effects,
      'set-regional-defaults',
      regionalTriggerScript,
      fill ? { SETTINGS: JSON.stringify(regionalSettings(defaults)) } : {},
    )
    await storeJson.merge(effects, {
      regionalDefaults: { ...defaults, fill },
    })

    return fill
      ? {
          version: '1',
          title: i18n('Regional Defaults Saved'),
          message: i18n(
            'New accounts start with these settings from now on. Existing accounts keep theirs.',
          ),
          result: null,
        }
      : {
          version: '1',
          title: i18n('Regional Defaults Turned Off'),
          message: i18n(
            "New accounts start with LiftTrace's own defaults again. Existing accounts keep their settings.",
          ),
          result: null,
        }
  },
)
