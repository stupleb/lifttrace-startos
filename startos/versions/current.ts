import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.4.0:2',
  releaseNotes: {
    en_US:
      'Set Regional Defaults applies to new accounts as soon as they are created and leaves existing accounts unchanged.',
    es_ES:
      'Establecer valores regionales predeterminados se aplica a las cuentas nuevas en cuanto se crean y no cambia las cuentas existentes.',
    de_DE:
      'Regionale Standardwerte festlegen gilt für neue Konten, sobald sie angelegt werden, und lässt bestehende Konten unverändert.',
    pl_PL:
      'Ustaw domyślne ustawienia regionalne działa na nowe konta od chwili ich utworzenia i nie zmienia istniejących kont.',
    fr_FR:
      "Définir les paramètres régionaux par défaut s'applique aux nouveaux comptes dès leur création et ne modifie pas les comptes existants.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
