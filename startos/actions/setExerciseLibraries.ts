import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  exerciseSources,
  listLibrariesScript,
  runInImage,
  setLibrariesScript,
} from '../utils'

const inputSpec = sdk.InputSpec.of({
  libraries: sdk.Value.multiselect({
    name: i18n('Libraries'),
    description: i18n(
      'Ticked libraries are downloaded into the shared exercise library; unticked ones are removed from it.',
    ),
    default: ['free-db'],
    values: {
      'free-db': i18n(
        'Free Exercise DB: about 870 exercises with photos, public domain',
      ),
      wger: i18n('wger: about 950 exercises, few images, CC BY-SA 4.0'),
      'exercisedb-oss': i18n(
        'ExerciseDB (open source): about 1,500 exercises with animations, AGPL-3.0, from a community server',
      ),
    } satisfies Record<(typeof exerciseSources)[number], string>,
  }),
})

export const setExerciseLibraries = sdk.Action.withInput(
  'set-exercise-libraries',

  async ({ effects }) => ({
    name: i18n('Choose Exercise Libraries'),
    description: i18n(
      'Choose which public exercise catalogs fill the exercise library every LiftTrace account picks from. Exercises people create themselves are never touched.',
    ),
    warning: i18n(
      'A removed library disappears from exercise lists and pickers. Workouts already logged keep their exercises, and adding the library back restores the same entries.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    const { stdout } = await runInImage(
      effects,
      'exercise-libraries',
      listLibrariesScript,
    )
    const present = JSON.parse(stdout.toString().trim().split('\n').pop()!)
    // An empty library may only be waiting for LiftTrace's first start, or for internet access, to seed it.
    return {
      libraries: present.length
        ? present
        : await storeJson.read((s) => s.exerciseLibraries).once(),
    }
  },

  async ({ effects, input }) => {
    // Stored first: while the library is nearly empty, LiftTrace retries a failed download at each start.
    await storeJson.merge(effects, { exerciseLibraries: input.libraries })
    await runInImage(effects, 'exercise-libraries', setLibrariesScript, {
      SOURCES: JSON.stringify(input.libraries),
    })
  },
)
