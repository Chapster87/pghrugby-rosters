/**
 * Namespaced localStorage keys for the Matchday Squad builder.
 * Intentionally distinct from legacy `roster-generator.html` keys.
 */
export const STORAGE_KEYS = {
  draft: "pghrugby.draft",
  playerLibrary: "pghrugby.playerLibrary",
  sponsors: "pghrugby.sponsors",
  clubLogo: "pghrugby.clubLogo",
  backgroundImage: "pghrugby.backgroundImage",
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
