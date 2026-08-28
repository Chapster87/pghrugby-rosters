import { supabase } from "@/utils/supabase"

import type { Draft, Sponsors, Venue } from "../new/_static/builder-types"
import { SPONSOR_SLOT_COUNT } from "../new/_static/builder-types"
import type { GraphicFormatId } from "../new/_static/graphic-formats"
import { ROSTER_SLOT_DEFINITIONS } from "../new/_static/roster-slots"
import {
  FIXED_SLOT_MAX,
  LEAGUE_LABEL,
  STATE_VERSION,
  type CloudRosterRow,
  type CloudRosterState,
  type LeagueId,
} from "../_static/cloud-roster"

/** Builder-shaped editor state hydrated from a cloud row. */
export type DeserializedRoster = {
  draft: Draft
  sponsors: Sponsors
  /** False = sponsors follow league defaults; true = custom set. */
  sponsorsIsCustom: boolean
  clubLogo: string | null
  backgroundImage: string | null
  /** False = background follows the shared app default; true = custom. */
  backgroundIsCustom: boolean
  activeFormat: GraphicFormatId
}

/**
 * Everything a Save needs from the editor. The auto title is derived from
 * League + Division + opponent + venue + date unless `titleIsCustom` pins it.
 */
export type RosterWrite = {
  league: LeagueId
  draft: Draft
  sponsors: Sponsors
  /** False = sponsors follow league defaults; true = custom set. */
  sponsorsIsCustom: boolean
  clubLogo: string | null
  /** Background Image URL (Drive-converted), or null to keep the default. */
  backgroundImage: string | null
  /** False = background follows the shared app default; true = custom. */
  backgroundIsCustom: boolean
  activeFormat: GraphicFormatId
  /** When true, `title` is fixed and auto-title stops. */
  titleIsCustom?: boolean
  /** Explicit title; used when `titleIsCustom` is true. */
  title?: string
}

const MONTH_ABBREV = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

/** "2026-04-11" → "11 Apr 2026" (UTC, deterministic — no locale/timezone drift). */
export function formatAutoTitleDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  if (!y || !m || !d) return isoDate
  return `${d} ${MONTH_ABBREV[m - 1] ?? ""} ${y}`
}

/**
 * `{League} {Division?} {vs|@} {Opponent} · {Date}` — Home → vs, Away → @,
 * Division omitted when empty, TBD when opponent/date are missing.
 */
export function buildAutoTitle(input: {
  league: LeagueId
  division: string | null
  opponent: string
  venue: Venue
  matchDate: string
}): string {
  const league = LEAGUE_LABEL[input.league]
  const division = input.division?.trim() ? ` ${input.division.trim()}` : ""
  const marker = input.venue === "Away" ? "@" : "vs"
  const opponent = input.opponent.trim() || "TBD"
  const date = input.matchDate ? formatAutoTitleDate(input.matchDate) : "TBD"
  return `${league}${division} ${marker} ${opponent} · ${date}`
}

/** Only URL / site-path strings may live in cloud rows — never `data:` URLs. */
function storableImage(src: string | null): src is string {
  return src !== null && !src.startsWith("data:")
}

/** Editor state → row columns + `state` jsonb `v:1`. */
export function serializeRoster(write: RosterWrite): {
  title: string
  title_is_custom: boolean
  league: LeagueId
  division: string | null
  match_type: CloudRosterState["match"]["match_type"]
  opponent: string | null
  match_date: string | null
  state: CloudRosterState
} {
  const titleIsCustom = Boolean(write.titleIsCustom)
  const title = titleIsCustom
    ? (write.title ?? "")
    : buildAutoTitle({
        league: write.league,
        division: write.draft.division,
        opponent: write.draft.opponent,
        venue: write.draft.venue,
        matchDate: write.draft.matchDate,
      })

  const roster: CloudRosterState["roster"] = {}
  for (const [numStr, slot] of Object.entries(write.draft.slots)) {
    const num = Number(numStr)
    // 1–15 always present (empty name OK); finishers 16+ only when filled.
    if (num <= FIXED_SLOT_MAX || slot.name.trim()) {
      roster[numStr] = { player_name: slot.name, label: slot.position }
    }
  }

  return {
    title,
    title_is_custom: titleIsCustom,
    league: write.league,
    division: write.draft.division.trim() || null,
    match_type: "league",
    opponent: write.draft.opponent.trim() || null,
    match_date: write.draft.matchDate || null,
    state: {
      v: STATE_VERSION,
      match: {
        league: write.league,
        division: write.draft.division.trim() || null,
        match_type: "league",
        opponent: write.draft.opponent,
        match_date: write.draft.matchDate || null,
        kickoff: write.draft.kickoff,
        timezone: write.draft.timezone.trim(),
        venue: write.draft.venue,
        location_name: write.draft.locationName,
        address: write.draft.address,
        address2: write.draft.address2,
      },
      roster,
      branding: {
        club_logo: storableImage(write.clubLogo) ? write.clubLogo : null,
        sponsors: write.sponsors.map((src) => (storableImage(src) ? src : "")),
        sponsors_is_custom: Boolean(write.sponsorsIsCustom),
        background_image: storableImage(write.backgroundImage)
          ? write.backgroundImage
          : null,
        background_is_custom: Boolean(write.backgroundIsCustom),
        story_background_image: null,
      },
      ui: {
        active_format: write.activeFormat === "story" ? "story" : "post",
      },
    },
  }
}

function isVenue(value: unknown): value is Venue {
  return value === "Home" || value === "Away"
}

/** Cloud row → builder-shaped editor state (image data URLs never round-trip). */
export function deserializeRoster(row: CloudRosterRow): DeserializedRoster {
  const state = row.state

  const slots: Draft["slots"] = {}
  // Starters always present with default Position labels.
  for (const def of ROSTER_SLOT_DEFINITIONS) {
    if (def.number <= FIXED_SLOT_MAX) {
      slots[def.number] = { name: "", position: def.position }
    }
  }
  const storedRoster = state?.roster ?? {}
  for (const [numStr, entry] of Object.entries(storedRoster)) {
    const num = Number(numStr)
    if (!Number.isInteger(num) || num < 1) continue
    const def = ROSTER_SLOT_DEFINITIONS.find((d) => d.number === num)
    slots[num] = {
      name: entry.player_name ?? "",
      position: entry.label || def?.position || "Finisher",
    }
  }

  const storedSponsors = state?.branding?.sponsors ?? []
  const sponsors: Sponsors = Array.from(
    { length: SPONSOR_SLOT_COUNT },
    (_, i) => (typeof storedSponsors[i] === "string" ? storedSponsors[i] : "")
  )

  return {
    draft: {
      league: state?.match?.league ?? "",
      opponent: state?.match?.opponent ?? "",
      matchDate: state?.match?.match_date ?? "",
      kickoff: state?.match?.kickoff ?? "",
      timezone: state?.match?.timezone ?? "",
      venue: isVenue(state?.match?.venue) ? state.match.venue : "Home",
      division: state?.match?.division ?? "",
      locationName: state?.match?.location_name ?? "",
      address: state?.match?.address ?? "",
      address2: state?.match?.address2 ?? "",
      slots,
    },
    sponsors,
    // Rows saved before league-defaults shipped have no flag: treat them as
    // custom so old Rosters keep their set and never reset to new defaults.
    sponsorsIsCustom: state?.branding?.sponsors_is_custom !== false,
    clubLogo: state?.branding?.club_logo ?? null,
    backgroundImage: state?.branding?.background_image ?? null,
    // Rows saved before the shared default shipped have no flag: treat them as
    // custom so saved backgrounds never reset when the default changes.
    backgroundIsCustom: state?.branding?.background_is_custom !== false,
    activeFormat: state?.ui?.active_format === "story" ? "story" : "portrait",
  }
}

function postgrestError(
  error: { message?: string } | null,
  fallback: string
): Error {
  return new Error(error?.message || fallback)
}

/** Load one Roster row by id (anon/auth SELECT by id per RLS share policy). */
export async function fetchRoster(id: string): Promise<CloudRosterRow | null> {
  const { data, error } = await supabase
    .from("roster_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw postgrestError(error, "Could not load this Roster.")
  return (data as CloudRosterRow | null) ?? null
}

/** First cloud Save from `/roster/new/` scratch. Returns the new row id. */
export async function insertRoster(
  write: RosterWrite,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("roster_drafts")
    .insert({ ...serializeRoster(write), created_by: userId })
    .select("id")
    .single()
  if (error) throw postgrestError(error, "Could not save this Roster.")
  return data.id as string
}

/** Update an existing Roster row on Save. */
export async function updateRoster(
  id: string,
  write: RosterWrite
): Promise<void> {
  const { error } = await supabase
    .from("roster_drafts")
    .update(serializeRoster(write))
    .eq("id", id)
  if (error) throw postgrestError(error, "Could not save this Roster.")
}

/** Hard delete of a Roster row (authenticated Operators only). */
export async function deleteRoster(id: string): Promise<void> {
  const { error } = await supabase.from("roster_drafts").delete().eq("id", id)
  if (error) throw postgrestError(error, "Could not delete this Roster.")
}

/**
 * Clone a Roster row as a new draft with the same content. The copy's title
 * is pinned to "Copy of <source>" so it stands out in the list; uploaded
 * images are data URLs that never round-trip (cloud contract), so they fall
 * back to defaults exactly as re-opening a saved Roster does.
 */
export async function duplicateRoster(
  id: string,
  userId: string
): Promise<string> {
  const row = await fetchRoster(id)
  if (!row) throw new Error("Could not load this Roster.")
  const base = deserializeRoster(row)
  return insertRoster(
    {
      league: row.league,
      draft: base.draft,
      sponsors: base.sponsors,
      sponsorsIsCustom: base.sponsorsIsCustom,
      clubLogo: base.clubLogo,
      backgroundImage: base.backgroundImage,
      backgroundIsCustom: base.backgroundIsCustom,
      activeFormat: base.activeFormat,
      titleIsCustom: true,
      title: `Copy of ${row.title}`,
    },
    userId
  )
}
