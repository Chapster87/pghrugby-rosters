import type { PlayerLibrary } from "../_static/builder-types"

/**
 * Photo for a Roster Slot, in order:
 * 1. Slot-frozen `photoUrl` (saved with the Roster — survives library edits)
 * 2. Player Library match by exact display name (working week / not yet frozen)
 * 3. Club Logo fallback
 */
export function resolveSlotPhotoSrc(
  name: string,
  photoUrl: string | undefined,
  playerLibrary: PlayerLibrary,
  clubLogoSrc: string
): string {
  const frozen = (photoUrl ?? "").trim()
  if (frozen) return frozen

  const trimmed = name.trim()
  if (trimmed && playerLibrary[trimmed]) {
    return playerLibrary[trimmed]
  }
  return clubLogoSrc
}
