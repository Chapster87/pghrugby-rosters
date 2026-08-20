"use client"

import type { ReactNode } from "react"

import type { UseBuilderStateResult } from "../../new/hooks/use-builder-state"
import MatchDetailsPanel from "../../new/_components/match-details"
import PlayerLibraryPanel from "../../new/_components/player-library"
import PreviewPanel from "../../new/_components/preview"
import RosterSlotsPanel from "../../new/_components/roster-slots"
import SponsorsPanel from "../../new/_components/sponsors"

import s from "./style.module.css"

type RosterEditorProps = {
  builder: UseBuilderStateResult
  /** Extra controls rendered under the panels (Save/Delete/League…). */
  actions?: ReactNode
}

/**
 * Composed Mk.1 editor: controls column (Match Details, Player Library,
 * Roster Slots, Sponsors) + live Post/Story preview. Shared by the create
 * surface (`/roster/new/`) and the edit surface (`/roster/<uuid>/`).
 */
export default function RosterEditor({ builder, actions }: RosterEditorProps) {
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

        {actions ? <div className={s.actions}>{actions}</div> : null}
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
