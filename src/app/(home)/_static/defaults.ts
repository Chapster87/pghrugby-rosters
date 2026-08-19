import type {
  BuilderState,
  Draft,
  MatchDetails,
  PlayerLibrary,
  RosterSlotValue,
  Sponsors,
} from "./builder-types"
import { SPONSOR_SLOT_COUNT } from "./builder-types"
import { ROSTER_SLOT_DEFINITIONS } from "./roster-slots"

/** Simple SVG placeholder used when no Club Logo has been uploaded. */
export const CLUB_LOGO_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect width="240" height="240" fill="#1a1a1a"/>
      <circle cx="120" cy="120" r="96" fill="none" stroke="#ffb81c" stroke-width="8"/>
      <text x="120" y="128" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#ffb81c">FORGE</text>
    </svg>`
  )

export function createEmptyMatchDetails(): MatchDetails {
  return {
    opponent: "",
    matchDate: "",
    kickoff: "",
    venue: "Home",
    competition: "",
    address: "",
  }
}

export function createDefaultRosterSlots(): Record<number, RosterSlotValue> {
  const slots: Record<number, RosterSlotValue> = {}
  for (const def of ROSTER_SLOT_DEFINITIONS) {
    slots[def.number] = {
      name: "",
      position: def.position,
    }
  }
  return slots
}

export function createEmptyDraft(): Draft {
  return {
    ...createEmptyMatchDetails(),
    slots: createDefaultRosterSlots(),
  }
}

export function createEmptyPlayerLibrary(): PlayerLibrary {
  return {}
}

export function createEmptySponsors(): Sponsors {
  return Array.from({ length: SPONSOR_SLOT_COUNT }, () => "")
}

export function createDefaultBuilderState(): BuilderState {
  return {
    draft: createEmptyDraft(),
    playerLibrary: createEmptyPlayerLibrary(),
    sponsors: createEmptySponsors(),
    clubLogo: null,
    activeFormat: "portrait",
  }
}

/** Resolve Club Logo src for display/export: uploaded value or placeholder. */
export function resolveClubLogoSrc(clubLogo: string | null): string {
  return clubLogo || CLUB_LOGO_PLACEHOLDER
}
