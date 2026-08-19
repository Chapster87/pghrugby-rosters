import type { PlayerLibrary } from "../_static/builder-types"

/**
 * Photo for a Roster Slot: Player Library match by exact display name,
 * otherwise Club Logo (same rule as the HTML builder).
 */
export function resolveSlotPhotoSrc(
  name: string,
  playerLibrary: PlayerLibrary,
  clubLogoSrc: string
): string {
  const trimmed = name.trim()
  if (trimmed && playerLibrary[trimmed]) {
    return playerLibrary[trimmed]
  }
  return clubLogoSrc
}
