import type {
  Draft,
  PlayerLibrary,
  RosterSlotValue,
  Sponsors,
  Venue,
} from "../_static/builder-types"
import { SPONSOR_SLOT_COUNT } from "../_static/builder-types"
import {
  createDefaultRosterSlots,
  createEmptyDraft,
  createEmptyPlayerLibrary,
  createEmptySponsors,
} from "../_static/defaults"
import type { LeagueId } from "../../_static/cloud-roster"
import { ROSTER_SLOT_DEFINITIONS } from "../_static/roster-slots"
import { STORAGE_KEYS } from "../_static/storage-keys"

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  )
}

function readRaw(key: string): string | null {
  if (!canUseStorage()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeRaw(key: string, value: string): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Quota / private mode — fail quietly; in-memory state still works.
  }
}

function removeRaw(key: string): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function isVenue(value: unknown): value is Venue {
  return value === "Home" || value === "Away"
}

function isLeague(value: unknown): value is LeagueId {
  return value === "mens" || value === "womens"
}

function normalizeSlot(
  raw: unknown,
  fallbackPosition: string
): RosterSlotValue {
  if (!raw || typeof raw !== "object") {
    return { name: "", position: fallbackPosition }
  }
  const record = raw as Record<string, unknown>
  // Accept legacy HTML shape `{ name, pos }` and scaffold shape `{ name, position }`.
  const name = typeof record.name === "string" ? record.name : ""
  const position =
    typeof record.position === "string"
      ? record.position
      : typeof record.pos === "string"
        ? record.pos
        : fallbackPosition
  return { name, position }
}

function normalizeDraft(raw: unknown): Draft {
  const empty = createEmptyDraft()
  if (!raw || typeof raw !== "object") return empty

  const record = raw as Record<string, unknown>
  const slotsRaw =
    record.slots && typeof record.slots === "object"
      ? (record.slots as Record<string, unknown>)
      : {}

  const slots = createDefaultRosterSlots()
  for (const def of ROSTER_SLOT_DEFINITIONS) {
    slots[def.number] = normalizeSlot(
      slotsRaw[String(def.number)] ?? slotsRaw[def.number],
      def.position
    )
  }

  return {
    league: isLeague(record.league) ? record.league : "",
    opponent: typeof record.opponent === "string" ? record.opponent : "",
    matchDate: typeof record.matchDate === "string" ? record.matchDate : "",
    kickoff: typeof record.kickoff === "string" ? record.kickoff : "",
    venue: isVenue(record.venue) ? record.venue : "Home",
    // Legacy drafts stored the level under `competition`; Division is the label now.
    division:
      typeof record.division === "string"
        ? record.division
        : typeof record.competition === "string"
          ? record.competition
          : "",
    address: typeof record.address === "string" ? record.address : "",
    slots,
  }
}

function normalizePlayerLibrary(raw: unknown): PlayerLibrary {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return createEmptyPlayerLibrary()
  }
  const library: PlayerLibrary = {}
  for (const [name, url] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof url === "string" && url.length > 0) {
      library[name] = url
    }
  }
  return library
}

function normalizeSponsors(raw: unknown): Sponsors {
  const sponsors = createEmptySponsors()
  if (!Array.isArray(raw)) return sponsors
  for (let i = 0; i < SPONSOR_SLOT_COUNT; i++) {
    const value = raw[i]
    sponsors[i] = typeof value === "string" ? value : ""
  }
  return sponsors
}

export function loadDraft(): Draft {
  const raw = readRaw(STORAGE_KEYS.draft)
  if (!raw) return createEmptyDraft()
  try {
    return normalizeDraft(JSON.parse(raw))
  } catch {
    return createEmptyDraft()
  }
}

export function saveDraft(draft: Draft): void {
  writeRaw(STORAGE_KEYS.draft, JSON.stringify(draft))
}

export function clearDraftStorage(): void {
  removeRaw(STORAGE_KEYS.draft)
}

export function loadPlayerLibrary(): PlayerLibrary {
  const raw = readRaw(STORAGE_KEYS.playerLibrary)
  if (!raw) return createEmptyPlayerLibrary()
  try {
    return normalizePlayerLibrary(JSON.parse(raw))
  } catch {
    return createEmptyPlayerLibrary()
  }
}

export function savePlayerLibrary(library: PlayerLibrary): void {
  writeRaw(STORAGE_KEYS.playerLibrary, JSON.stringify(library))
}

export function loadSponsors(): Sponsors {
  const raw = readRaw(STORAGE_KEYS.sponsors)
  if (!raw) return createEmptySponsors()
  try {
    return normalizeSponsors(JSON.parse(raw))
  } catch {
    return createEmptySponsors()
  }
}

export function saveSponsors(sponsors: Sponsors): void {
  writeRaw(STORAGE_KEYS.sponsors, JSON.stringify(sponsors))
}

export function loadClubLogo(): string | null {
  const raw = readRaw(STORAGE_KEYS.clubLogo)
  return raw && raw.length > 0 ? raw : null
}

export function saveClubLogo(dataUrl: string | null): void {
  if (!dataUrl) {
    removeRaw(STORAGE_KEYS.clubLogo)
    return
  }
  writeRaw(STORAGE_KEYS.clubLogo, dataUrl)
}
