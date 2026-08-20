import type { GraphicFormatId } from "./graphic-formats"

export type Venue = "Home" | "Away"

/** Match Details shown on the graphic header. */
export type MatchDetails = {
  opponent: string
  matchDate: string
  kickoff: string
  venue: Venue
  competition: string
  address: string
}

/** Operator-entered values for one Roster Slot. */
export type RosterSlotValue = {
  /** Player display name; empty means unfilled. */
  name: string
  /** Position label (defaults from rugby numbering; Operator may edit). */
  position: string
}

/**
 * In-progress Match Details + Roster Slot names/positions.
 * Persisted between sessions; Club Logo / Player Library / Sponsors are separate.
 */
export type Draft = MatchDetails & {
  slots: Record<number, RosterSlotValue>
}

/** Player display name → photo URL map. */
export type PlayerLibrary = Record<string, string>

/** Fixed sponsor logo slots (data URLs or empty strings). */
export type Sponsors = string[]

export const SPONSOR_SLOT_COUNT = 6

export type BuilderState = {
  draft: Draft
  playerLibrary: PlayerLibrary
  sponsors: Sponsors
  /** Club Logo data URL, or null to use the placeholder. */
  clubLogo: string | null
  activeFormat: GraphicFormatId
}
