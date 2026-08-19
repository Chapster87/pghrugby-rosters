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
 * Section components are seams for later parity / preview / export tickets.
 */
export default function BuilderShell() {
  const builder = useBuilderState()

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
          <Button variant="secondary" type="button" onClick={builder.clearDraft}>
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
