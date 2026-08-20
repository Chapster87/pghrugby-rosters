/**
 * Landing table domain: labels + the shape of a `roster_drafts` row as the
 * landing reads it. Mirrors the columns locked in Grilling: Cloud Draft schema
 * and JSON contract; venue rides inside `state.match.venue`.
 */

export type LeagueId = "mens" | "womens"

export type MatchTypeId = "league" | "friendly" | "playoff" | "tour"

export type Venue = "Home" | "Away"

export type RosterRow = {
  id: string
  title: string
  league: LeagueId
  division: string | null
  match_type: MatchTypeId
  opponent: string | null
  match_date: string | null
  updated_at: string
  state: { match?: { venue?: Venue } } | null
}

export const LEAGUE_LABEL: Record<LeagueId, string> = {
  mens: "Men's",
  womens: "Women's",
}

export const MATCH_TYPE_LABEL: Record<MatchTypeId, string> = {
  league: "League",
  friendly: "Friendly",
  playoff: "Playoff",
  tour: "Tour",
}
