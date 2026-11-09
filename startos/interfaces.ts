import { primaryUrl } from './actions/setPrimaryUrl'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiHostId, uiInterfaceId, uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const launcherUrl = await primaryUrl.bestUsable(effects).const()

  const uiMulti = sdk.MultiHost.of(effects, uiHostId)
  const uiMultiOrigin = await uiMulti.bindPort(uiPort, { protocol: 'http' })
  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: uiInterfaceId,
    description: i18n(
      'The LiftTrace web app and API. The Android and Wear OS apps connect here too.',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
    preferredLauncherAddress: launcherUrl,
  })

  return [await uiMultiOrigin.export([ui])]
})
