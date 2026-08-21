"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type {
  BuilderState,
  Draft,
  MatchDetails,
  PlayerLibrary,
  RosterSlotValue,
  Sponsors,
} from "../_static/builder-types"
import type { GraphicFormatId } from "../_static/graphic-formats"
import {
  createEmptyDraft,
  createDefaultBuilderState,
  createEmptyPlayerLibrary,
  resolveClubLogoSrc,
} from "../_static/defaults"
import {
  clearDraftStorage,
  loadBackgroundImage,
  loadClubLogo,
  loadDraft,
  loadPlayerLibrary,
  loadSponsors,
  saveBackgroundImage,
  saveClubLogo,
  saveDraft,
  savePlayerLibrary,
  saveSponsors,
} from "../_helpers/storage"
import {
  fetchPlayerLibrary,
  removePlayerLibraryEntry as removeCloudPlayerLibraryEntry,
  upsertPlayerLibraryEntries,
} from "../../_helpers/player-library"
import {
  fetchLeagueDefaults,
  upsertLeagueDefaults,
} from "../../_helpers/league-defaults"
import {
  fetchAppDefaultBackground,
  upsertAppDefaultBackground,
} from "../../_helpers/app-defaults"

export type BuilderSeed = {
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

export type UseBuilderStateResult = {
  /** False until client storage has been read (avoids SSR/local mismatch). */
  isReady: boolean
  draft: Draft
  playerLibrary: PlayerLibrary
  sponsors: Sponsors
  /** False = sponsors follow league defaults; true = custom set. */
  sponsorsIsCustom: boolean
  clubLogo: string | null
  /** Club Logo src for UI: uploaded value or placeholder. */
  clubLogoSrc: string
  /** Background Image URL, or null for the default. */
  backgroundImage: string | null
  /** False = background follows the shared app default; true = custom. */
  backgroundIsCustom: boolean
  activeFormat: GraphicFormatId
  setActiveFormat: (format: GraphicFormatId) => void
  updateMatchDetails: (patch: Partial<MatchDetails>) => void
  updateRosterSlot: (number: number, patch: Partial<RosterSlotValue>) => void
  setPlayerLibrary: (library: PlayerLibrary) => void
  upsertPlayerLibraryEntry: (name: string, photoUrl: string) => void
  removePlayerLibraryEntry: (name: string) => void
  setSponsors: (sponsors: Sponsors) => void
  updateSponsorSlot: (index: number, dataUrl: string) => void
  clearSponsorSlot: (index: number) => void
  /** Move a sponsor logo earlier/later among filled slots (customizes the set). */
  reorderSponsors: (next: Sponsors) => void
  setClubLogo: (dataUrl: string | null) => void
  setBackgroundImage: (url: string | null) => void
  setSponsorsIsCustom: (custom: boolean) => void
  /** Re-apply league defaults (also unfreezes the custom flag). */
  useLeagueDefaults: () => void
  /** Save the working sponsor set as the current League's defaults. */
  saveLeagueDefaults: () => Promise<void>
  setBackgroundIsCustom: (custom: boolean) => void
  /** Stop customizing and re-apply the shared background default. */
  useDefaultBackground: () => void
  /** Save the working background as the app-wide default. */
  saveDefaultBackground: () => Promise<void>
  /** Clears Draft only; keeps Club Logo, Player Library, and Sponsors. */
  clearDraft: () => void
}

/**
 * Editor state hydrated from a cloud Roster row instead of the local scratch
 * draft. Draft edits are not written to localStorage in this mode — the cloud
 * row is the source of truth and local autosave stays the create surface's
 * scratch.
 *
 * `userId` (when signed in) enables the cloud-shared Player Library: the cloud
 * copy loads and merges over the browser-local one, and add/remove sync up.
 */
export function useBuilderState(
  seed?: BuilderSeed | null,
  userId?: string
): UseBuilderStateResult {
  const [isReady, setIsReady] = useState(false)
  const [state, setState] = useState<BuilderState>(createDefaultBuilderState)

  /* eslint-disable react-hooks/set-state-in-effect -- SSR-safe hydration: this
     effect exists to pull external state (localStorage, or a cloud row seed)
     into React after mount so the statically-exported HTML never mismatches;
     the advisory targets derived state, not external-system hydration. */
  useEffect(() => {
    if (seed) {
      // Cloud-backed editing: draft/sponsors/logo/format come from the row;
      // the Player Library is per-League and shared (never on the row).
      setState({
        draft: seed.draft,
        playerLibrary: loadPlayerLibrary(seed.draft.league || "mens"),
        sponsors: seed.sponsors,
        sponsorsIsCustom: seed.sponsorsIsCustom,
        clubLogo: seed.clubLogo,
        backgroundImage: seed.backgroundImage,
        backgroundIsCustom: seed.backgroundIsCustom,
        activeFormat: seed.activeFormat,
      })
    } else {
      const draft = loadDraft()
      setState({
        draft,
        playerLibrary: draft.league
          ? loadPlayerLibrary(draft.league)
          : createEmptyPlayerLibrary(),
        sponsors: loadSponsors(),
        sponsorsIsCustom: false,
        clubLogo: loadClubLogo(),
        backgroundImage: loadBackgroundImage(),
        backgroundIsCustom: false,
        activeFormat: "portrait",
      })
    }
    setIsReady(true)
  }, [seed])
  /* eslint-enable react-hooks/set-state-in-effect */

  /*
    Cloud-shared Player Library, split by League: the active League's entries
    load from the cloud and merge over the browser-local set (cloud wins on
    conflicts; local-only entries are pushed up so nothing is lost). Swapping
    the Roster's League swaps the working library. Signed out — local only.
  */
  useEffect(() => {
    const league = state.draft.league
    if (!league) return
    const local = loadPlayerLibrary(league)
    savePlayerLibrary(league, local)
    setState((prev) => ({ ...prev, playerLibrary: local }))
    if (!userId) return
    let active = true
    fetchPlayerLibrary(league)
      .then((cloud) => {
        if (!active) return
        setState((prev) => {
          const playerLibrary: PlayerLibrary = {
            ...prev.playerLibrary,
            ...cloud,
          }
          savePlayerLibrary(league, playerLibrary)
          const localOnly = Object.entries(prev.playerLibrary).filter(
            ([name]) => !(name in cloud)
          )
          if (localOnly.length > 0) {
            void upsertPlayerLibraryEntries(
              league,
              localOnly.map(([player_name, photo_url]) => ({
                player_name,
                photo_url,
              }))
            ).catch(() => {})
          }
          return { ...prev, playerLibrary }
        })
      })
      .catch(() => {
        // Cloud unavailable (e.g. signed out) — keep the browser-local library.
      })
    return () => {
      active = false
    }
  }, [state.draft.league, userId])

  /*
    League-default sponsors: while a Roster is not custom, its working sponsor
    set follows the league defaults (applied on league set/change). Manual
    slot edits flip `sponsorsIsCustom`, freezing the set; "Use League
    defaults" unfreezes it. Saved Rosters keep their snapshot (deserialize
    treats a missing `sponsors_is_custom` as custom, so old rows never reset).
  */
  useEffect(() => {
    const league = state.draft.league
    if (!league || state.sponsorsIsCustom) return
    let active = true
    fetchLeagueDefaults(league)
      .then((defaults) => {
        if (!active) return
        setState((prev) => {
          if (prev.sponsorsIsCustom) return prev
          saveSponsors(defaults)
          return { ...prev, sponsors: defaults }
        })
      })
      .catch(() => {
        // Defaults unavailable — leave the current sponsor set as-is.
      })
    return () => {
      active = false
    }
  }, [state.draft.league, state.sponsorsIsCustom])

  /*
    Shared background default: while a Roster is not custom, its background
    follows the app-wide default (applied on load / when custom clears). New
    Rosters start not-custom, so the default shows immediately. Saved rows
    keep their snapshot (deserialize treats a missing `background_is_custom`
    as custom, so old backgrounds never reset).
  */
  useEffect(() => {
    if (state.backgroundIsCustom) return
    let active = true
    fetchAppDefaultBackground()
      .then((url) => {
        if (!active) return
        setState((prev) => {
          if (prev.backgroundIsCustom) return prev
          saveBackgroundImage(url)
          return { ...prev, backgroundImage: url }
        })
      })
      .catch(() => {
        // Default unavailable — leave the current background as-is.
      })
    return () => {
      active = false
    }
  }, [state.backgroundIsCustom])

  const setActiveFormat = useCallback((format: GraphicFormatId) => {
    setState((prev) => ({ ...prev, activeFormat: format }))
  }, [])

  const updateMatchDetails = useCallback(
    (patch: Partial<MatchDetails>) => {
      setState((prev) => {
        const draft = { ...prev.draft, ...patch }
        if (!seed) saveDraft(draft)
        return { ...prev, draft }
      })
    },
    [seed]
  )

  const updateRosterSlot = useCallback(
    (number: number, patch: Partial<RosterSlotValue>) => {
      setState((prev) => {
        const current = prev.draft.slots[number] ?? {
          name: "",
          position: "",
        }
        const draft: Draft = {
          ...prev.draft,
          slots: {
            ...prev.draft.slots,
            [number]: { ...current, ...patch },
          },
        }
        if (!seed) saveDraft(draft)
        return { ...prev, draft }
      })
    },
    [seed]
  )

  const setPlayerLibrary = useCallback(
    (library: PlayerLibrary) => {
      const league = state.draft.league
      if (!league) return
      savePlayerLibrary(league, library)
      setState((prev) => ({ ...prev, playerLibrary: library }))
    },
    [state.draft.league]
  )

  const upsertPlayerLibraryEntry = useCallback(
    (name: string, photoUrl: string) => {
      const trimmed = name.trim()
      if (!trimmed || !photoUrl) return
      const league = state.draft.league
      if (!league) return // Library is per-League; the panel gates on a League.
      setState((prev) => {
        const playerLibrary = {
          ...prev.playerLibrary,
          [trimmed]: photoUrl,
        }
        savePlayerLibrary(league, playerLibrary)
        return { ...prev, playerLibrary }
      })
      if (userId) {
        void upsertPlayerLibraryEntries(league, [
          { player_name: trimmed, photo_url: photoUrl },
        ]).catch(() => {})
      }
    },
    [state.draft.league, userId]
  )

  const removePlayerLibraryEntry = useCallback(
    (name: string) => {
      const league = state.draft.league
      if (!league) return
      setState((prev) => {
        if (!(name in prev.playerLibrary)) return prev
        const playerLibrary = { ...prev.playerLibrary }
        delete playerLibrary[name]
        savePlayerLibrary(league, playerLibrary)
        return { ...prev, playerLibrary }
      })
      if (userId) {
        void removeCloudPlayerLibraryEntry(league, name).catch(() => {})
      }
    },
    [state.draft.league, userId]
  )

  const setSponsorsState = useCallback((sponsors: Sponsors) => {
    saveSponsors(sponsors)
    setState((prev) => ({ ...prev, sponsors }))
  }, [])

  const updateSponsorSlot = useCallback((index: number, dataUrl: string) => {
    setState((prev) => {
      if (index < 0 || index >= prev.sponsors.length) return prev
      const sponsors = [...prev.sponsors]
      sponsors[index] = dataUrl
      saveSponsors(sponsors)
      // A manual slot edit customizes the set — stop following defaults.
      return { ...prev, sponsors, sponsorsIsCustom: true }
    })
  }, [])

  const clearSponsorSlot = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= prev.sponsors.length) return prev
      const sponsors = [...prev.sponsors]
      sponsors[index] = ""
      saveSponsors(sponsors)
      return { ...prev, sponsors, sponsorsIsCustom: true }
    })
  }, [])

  const reorderSponsors = useCallback((next: Sponsors) => {
    saveSponsors(next)
    // Reordering is a customization — stop following league defaults.
    setState((prev) => ({ ...prev, sponsors: next, sponsorsIsCustom: true }))
  }, [])

  const setClubLogo = useCallback((dataUrl: string | null) => {
    saveClubLogo(dataUrl)
    setState((prev) => ({ ...prev, clubLogo: dataUrl }))
  }, [])

  const setBackgroundImage = useCallback((url: string | null) => {
    saveBackgroundImage(url)
    // Setting a background is a customization — stop following the default.
    setState((prev) => ({
      ...prev,
      backgroundImage: url,
      backgroundIsCustom: true,
    }))
  }, [])

  const setSponsorsIsCustom = useCallback((custom: boolean) => {
    setState((prev) => ({ ...prev, sponsorsIsCustom: custom }))
  }, [])

  const useLeagueDefaults = useCallback(() => {
    const league = state.draft.league
    if (!league) return
    setState((prev) => ({ ...prev, sponsorsIsCustom: false }))
    void fetchLeagueDefaults(league)
      .then((defaults) => {
        setState((prev) => {
          saveSponsors(defaults)
          return { ...prev, sponsors: defaults, sponsorsIsCustom: false }
        })
      })
      .catch(() => {})
  }, [state.draft.league])

  const saveLeagueDefaults = useCallback(async (): Promise<void> => {
    const league = state.draft.league
    if (!league || !userId) {
      throw new Error("Sign in and choose a League before saving defaults.")
    }
    await upsertLeagueDefaults(league, state.sponsors, userId)
  }, [state.draft.league, state.sponsors, userId])

  const setBackgroundIsCustom = useCallback((custom: boolean) => {
    setState((prev) => ({ ...prev, backgroundIsCustom: custom }))
  }, [])

  const useDefaultBackground = useCallback(() => {
    setState((prev) => ({ ...prev, backgroundIsCustom: false }))
    void fetchAppDefaultBackground()
      .then((url) => {
        setState((prev) => {
          saveBackgroundImage(url)
          return { ...prev, backgroundImage: url, backgroundIsCustom: false }
        })
      })
      .catch(() => {})
  }, [])

  const saveDefaultBackground = useCallback(async (): Promise<void> => {
    if (!userId) {
      throw new Error("Sign in before saving a default background.")
    }
    await upsertAppDefaultBackground(state.backgroundImage, userId)
  }, [state.backgroundImage, userId])

  const clearDraft = useCallback(() => {
    clearDraftStorage()
    setState((prev) => ({
      ...prev,
      draft: createEmptyDraft(),
    }))
  }, [])

  const clubLogoSrc = useMemo(
    () => resolveClubLogoSrc(state.clubLogo),
    [state.clubLogo]
  )

  return {
    isReady,
    draft: state.draft,
    playerLibrary: state.playerLibrary,
    sponsors: state.sponsors,
    sponsorsIsCustom: state.sponsorsIsCustom,
    clubLogo: state.clubLogo,
    clubLogoSrc,
    backgroundImage: state.backgroundImage,
    backgroundIsCustom: state.backgroundIsCustom,
    activeFormat: state.activeFormat,
    setActiveFormat,
    updateMatchDetails,
    updateRosterSlot,
    setPlayerLibrary,
    upsertPlayerLibraryEntry,
    removePlayerLibraryEntry,
    setSponsors: setSponsorsState,
    updateSponsorSlot,
    clearSponsorSlot,
    reorderSponsors,
    setClubLogo,
    setBackgroundImage,
    setSponsorsIsCustom,
    useLeagueDefaults,
    saveLeagueDefaults,
    setBackgroundIsCustom,
    useDefaultBackground,
    saveDefaultBackground,
    clearDraft,
  }
}
