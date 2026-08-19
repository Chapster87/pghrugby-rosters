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

/**
 * Official Pittsburgh Forge crest used when no Club Logo has been uploaded.
 * Served from `public/`; Operator upload still overrides via localStorage.
 */
export const CLUB_LOGO_DEFAULT = "/images/pittsburgh-forge-crest.png"

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

/** Resolve Club Logo src for display/export: uploaded value or official crest. */
export function resolveClubLogoSrc(clubLogo: string | null): string {
  return clubLogo || CLUB_LOGO_DEFAULT
}
