"use client"

import Button from "@/components/button"

import { useBuilderState } from "../../hooks/use-builder-state"
import MatchDetailsPanel from "../match-details"
import PlayerLibraryPanel from "../player-library"
import PreviewPanel from "../preview"
import RosterSlotsPanel from "../roster-slots"
import SponsorsPanel from "../sponsors"

import s from "./styles.module.css"

/**
 * Composed Matchday Squad builder shell.
 * Controls + live Portrait/Story preview + PNG Export.
 */
export default function BuilderShell() {
  const builder = useBuilderState()

  function handleClearDraft() {
    const confirmed = window.confirm(
      "Clear all names and match details for a new week? Your logo and photo library are kept."
    )
    if (!confirmed) return
    builder.clearDraft()
  }

  return (
    <div className={s.shell} data-ready={builder.isReady}>
      <div className={s.controls}>
        <MatchDetailsPanel
          value={builder.draft}
          onChange={builder.updateMatchDetails}
          clubLogoSrc={builder.clubLogoSrc}
          onClubLogoChange={builder.setClubLogo}
        />

        <PlayerLibraryPanel
          library={builder.playerLibrary}
          clubLogoSrc={builder.clubLogoSrc}
          onUpsert={builder.upsertPlayerLibraryEntry}
          onRemove={builder.removePlayerLibraryEntry}
        />

        <RosterSlotsPanel
          draft={builder.draft}
          playerLibrary={builder.playerLibrary}
          onSlotChange={builder.updateRosterSlot}
        />

        <SponsorsPanel
          sponsors={builder.sponsors}
          onUpdateSlot={builder.updateSponsorSlot}
          onClearSlot={builder.clearSponsorSlot}
        />

        <div className={s.actions}>
          <Button variant="secondary" type="button" onClick={handleClearDraft}>
            New Week (clear roster)
          </Button>
        </div>
      </div>

      <div className={s.preview}>
        <PreviewPanel
          draft={builder.draft}
          playerLibrary={builder.playerLibrary}
          sponsors={builder.sponsors}
          clubLogoSrc={builder.clubLogoSrc}
          activeFormat={builder.activeFormat}
          onFormatChange={builder.setActiveFormat}
        />
      </div>
    </div>
  )
}
