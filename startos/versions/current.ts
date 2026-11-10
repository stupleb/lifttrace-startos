import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.4.0:1',
  releaseNotes: {
    en_US:
      'Adds a Set Regional Defaults action for the units, date format and time format that LiftTrace accounts start with. Requires StartOS 0.4.2 or later.',
    es_ES:
      'Añade la acción Establecer valores regionales predeterminados, para las unidades y los formatos de fecha y hora con los que empiezan las cuentas de LiftTrace. Requiere StartOS 0.4.2 o posterior.',
    de_DE:
      'Neue Aktion Regionale Standardwerte festlegen für Einheiten sowie Datums- und Zeitformat, mit denen LiftTrace-Konten beginnen. Erfordert StartOS 0.4.2 oder neuer.',
    pl_PL:
      'Dodaje akcję Ustaw domyślne ustawienia regionalne dla jednostek oraz formatów daty i czasu, od których zaczynają konta LiftTrace. Wymaga StartOS 0.4.2 lub nowszego.',
    fr_FR:
      "Ajoute l'action Définir les paramètres régionaux par défaut, pour les unités et les formats de date et d'heure avec lesquels les comptes LiftTrace commencent. Nécessite StartOS 0.4.2 ou une version ultérieure.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
