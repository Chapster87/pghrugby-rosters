/**
 * Cloud Roster persistence contract — the `roster_drafts` row shape and the
 * `state` jsonb `v:1` payload locked in Grilling: Cloud Draft schema and JSON
 * contract. UI noun: Roster (never Draft).
 */

export type LeagueId = "mens" | "womens"

export type MatchTypeId = "league" | "friendly" | "playoff" | "tour"

export type Venue = "Home" | "Away"

/** Stored Graphic Format ids. Product name Post replaces the retired Portrait. */
export type CloudFormatId = "post" | "story"

/**
 * `state` jsonb payload written on every cloud Save. `v` is the schema
 * version; Mk.2 writes `1` and unknown versions are a clear client error (no
 * migration framework this map).
 */
export type CloudRosterState = {
  v: 1
  match: {
    league: LeagueId
    division: string | null
    match_type: MatchTypeId
    opponent: string
    match_date: string | null
    kickoff: string
    /** Optional free-text timezone for the kickoff (e.g. ET). */
    timezone: string
    venue: Venue
    /** Venue/field name shown above the street address on the graphic. */
    location_name: string
    address: string
    /** Second address line (rendered below Address on the graphic). */
    address2: string
  }
  /** Jersey number (string key) → player. 1–15 always present; 16+ only when filled. */
  roster: Record<
    string,
    {
      player_name: string
      label: string
      /** Optional leadership mark (C / VC); omitted when empty on older rows. */
      title?: string
    }
  >
  branding: {
    /** URL or site path strings only — no `data:` URLs in cloud rows. */
    club_logo: string | null
    sponsors: string[]
    /** False = working sponsor set follows league defaults; true = custom. */
    sponsors_is_custom: boolean
    background_image: string | null
    /** False = background follows the shared app default; true = custom. */
    background_is_custom: boolean
    story_background_image: string | null
  }
  ui: {
    active_format: CloudFormatId
  }
}

/** A `roster_drafts` row as the persistence layer reads/writes it. */
export type CloudRosterRow = {
  id: string
  title: string
  title_is_custom: boolean
  league: LeagueId
  division: string | null
  match_type: MatchTypeId
  opponent: string | null
  match_date: string | null
  created_by: string
  created_at: string
  updated_at: string
  state: CloudRosterState | null
}

export const STATE_VERSION = 1 as const

export const LEAGUE_LABEL: Record<LeagueId, string> = {
  mens: "Men's",
  womens: "Women's",
}

/** First jersey numbers always present in `state.roster` (starters). */
export const FIXED_SLOT_MAX = 15
