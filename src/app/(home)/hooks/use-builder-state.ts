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
  resolveClubLogoSrc,
} from "../_static/defaults"
import {
  clearDraftStorage,
  loadClubLogo,
  loadDraft,
  loadPlayerLibrary,
  loadSponsors,
  saveClubLogo,
  saveDraft,
  savePlayerLibrary,
  saveSponsors,
} from "../_helpers/storage"

export type UseBuilderStateResult = {
  /** False until client storage has been read (avoids SSR/local mismatch). */
  isReady: boolean
  draft: Draft
  playerLibrary: PlayerLibrary
  sponsors: Sponsors
  clubLogo: string | null
  /** Club Logo src for UI: uploaded value or placeholder. */
  clubLogoSrc: string
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
  setClubLogo: (dataUrl: string | null) => void
  /** Clears Draft only; keeps Club Logo, Player Library, and Sponsors. */
  clearDraft: () => void
}

export function useBuilderState(): UseBuilderStateResult {
  const [isReady, setIsReady] = useState(false)
  const [state, setState] = useState<BuilderState>(createDefaultBuilderState)

  useEffect(() => {
    setState({
      draft: loadDraft(),
      playerLibrary: loadPlayerLibrary(),
      sponsors: loadSponsors(),
      clubLogo: loadClubLogo(),
      activeFormat: "portrait",
    })
    setIsReady(true)
  }, [])

  const setActiveFormat = useCallback((format: GraphicFormatId) => {
    setState((prev) => ({ ...prev, activeFormat: format }))
  }, [])

  const updateMatchDetails = useCallback((patch: Partial<MatchDetails>) => {
    setState((prev) => {
      const draft = { ...prev.draft, ...patch }
      saveDraft(draft)
      return { ...prev, draft }
    })
  }, [])

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
        saveDraft(draft)
        return { ...prev, draft }
      })
    },
    []
  )

  const setPlayerLibrary = useCallback((library: PlayerLibrary) => {
    savePlayerLibrary(library)
    setState((prev) => ({ ...prev, playerLibrary: library }))
  }, [])

  const upsertPlayerLibraryEntry = useCallback(
    (name: string, photoUrl: string) => {
      const trimmed = name.trim()
      if (!trimmed || !photoUrl) return
      setState((prev) => {
        const playerLibrary = {
          ...prev.playerLibrary,
          [trimmed]: photoUrl,
        }
        savePlayerLibrary(playerLibrary)
        return { ...prev, playerLibrary }
      })
    },
    []
  )

  const removePlayerLibraryEntry = useCallback((name: string) => {
    setState((prev) => {
      if (!(name in prev.playerLibrary)) return prev
      const playerLibrary = { ...prev.playerLibrary }
      delete playerLibrary[name]
      savePlayerLibrary(playerLibrary)
      return { ...prev, playerLibrary }
    })
  }, [])

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
      return { ...prev, sponsors }
    })
  }, [])

  const clearSponsorSlot = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= prev.sponsors.length) return prev
      const sponsors = [...prev.sponsors]
      sponsors[index] = ""
      saveSponsors(sponsors)
      return { ...prev, sponsors }
    })
  }, [])

  const setClubLogo = useCallback((dataUrl: string | null) => {
    saveClubLogo(dataUrl)
    setState((prev) => ({ ...prev, clubLogo: dataUrl }))
  }, [])

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
    clubLogo: state.clubLogo,
    clubLogoSrc,
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
    setClubLogo,
    clearDraft,
  }
}
