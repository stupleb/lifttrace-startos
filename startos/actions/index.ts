import { sdk } from '../sdk'
import { manageSmtp } from './manageSmtp'
import { setAdminPassword } from './setAdminPassword'
import { setApiAccess } from './setApiAccess'
import { setExerciseLibraries } from './setExerciseLibraries'
import { setRegionalDefaults } from './setRegionalDefaults'
import { primaryUrl } from './setPrimaryUrl'

export const actions = sdk.Actions.of()
  .addAction(setAdminPassword)
  .addAction(setExerciseLibraries)
  .addAction(setRegionalDefaults)
  .addAction(primaryUrl.action)
  .addAction(manageSmtp)
  .addAction(setApiAccess)
