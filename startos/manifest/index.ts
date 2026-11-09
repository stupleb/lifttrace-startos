import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'lifttrace',
  title: 'LiftTrace',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/stupleb/lifttrace-startos',
  upstreamRepo: 'https://github.com/TraceApps/lifttrace',
  marketingUrl: 'https://traceapps.github.io/docs/lifttrace/',
  donationUrl: 'https://ko-fi.com/traceapps',
  description: { short, long },
  volumes: ['main', 'startos'],
  images: {
    lifttrace: {
      source: {
        dockerTag:
          'ghcr.io/traceapps/lifttrace:latest@sha256:f19b28299b77d5cc81ba96aba54549b4f8b619d3173728c54caf817e982a7968',
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
