import { sdk } from './sdk'

export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.ofVolumes('main', 'startos').setOptions({
    // LiftTrace's own backup archives, each a dump of the database plus every uploaded image.
    exclude: ['/backups/'],
  }),
)
