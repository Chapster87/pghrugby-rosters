import type { GraphicFormatId } from "./graphic-formats"
import type { LeagueId } from "../../_static/cloud-roster"

export type Venue = "Home" | "Away"

/** Match Details shown on the graphic header. */
export type MatchDetails = {
  /** Men's | Women's — required before any cloud Save ("" = not chosen). */
  league: LeagueId | ""
  opponent: string
  matchDate: string
  kickoff: string
  venue: Venue
  /** Optional free-text level/flight within a League (distinguishes same-day games). */
  division: string
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
  /** False = sponsors follow league defaults; true = custom set. */
  sponsorsIsCustom: boolean
  /** Club Logo data URL (browser-local) or Drive-converted URL, or null for the crest. */
  clubLogo: string | null
  /** Background Image URL (Drive-converted), or null to keep the default. */
  backgroundImage: string | null
  activeFormat: GraphicFormatId
}
