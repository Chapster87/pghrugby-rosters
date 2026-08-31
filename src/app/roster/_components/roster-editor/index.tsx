"use client"

import type { UseBuilderStateResult } from "../../new/hooks/use-builder-state"
import MatchDetailsPanel from "../../new/_components/match-details"
import BackgroundImagePanel from "../../new/_components/background-image"
import ClubLogoPanel from "../../new/_components/club-logo"
import PlayerLibraryPanel from "../../new/_components/player-library"
import PreviewPanel from "../../new/_components/preview"
import RosterSlotsPanel from "../../new/_components/roster-slots"
import SponsorsPanel from "../../new/_components/sponsors"

import s from "./style.module.css"

type RosterEditorProps = {
  builder: UseBuilderStateResult
}

/**
 * Composed Mk.1 editor: controls column (Match Details, Player Library,
 * Roster Slots, Sponsors) + live Post/Story preview. Shared by the create
 * surface (`/roster/new/`) and the edit surface (`/roster/<uuid>/`).
 * Primary Save / New / menu actions live in each shell's top document strip.
 */
export default function RosterEditor({ builder }: RosterEditorProps) {
  return (
    <div className={s.shell} data-ready={builder.isReady}>
      <div className={s.controls}>
        <MatchDetailsPanel
          value={builder.draft}
          onChange={builder.updateMatchDetails}
        />

        <PlayerLibraryPanel
          library={builder.playerLibrary}
          clubLogoSrc={builder.clubLogoSrc}
          league={builder.draft.league}
          onUpsert={builder.upsertPlayerLibraryEntry}
          onRemove={builder.removePlayerLibraryEntry}
          onRename={builder.renamePlayerLibraryEntry}
        />

        <RosterSlotsPanel
          draft={builder.draft}
          playerLibrary={builder.playerLibrary}
          onSlotChange={builder.updateRosterSlot}
        />

        <ClubLogoPanel
          value={builder.clubLogo}
          clubLogoSrc={builder.clubLogoSrc}
          onChange={builder.setClubLogo}
        />

        <SponsorsPanel
          sponsors={builder.sponsors}
          isCustom={builder.sponsorsIsCustom}
          league={builder.draft.league}
          onUpdateSlot={builder.updateSponsorSlot}
          onClearSlot={builder.clearSponsorSlot}
          onReorder={builder.reorderSponsors}
          onUseLeagueDefaults={builder.useLeagueDefaults}
          onSaveLeagueDefaults={builder.saveLeagueDefaults}
        />

        <BackgroundImagePanel
          value={builder.backgroundImage}
          isCustom={builder.backgroundIsCustom}
          onChange={builder.setBackgroundImage}
          onUseDefault={builder.useDefaultBackground}
          onSaveDefault={builder.saveDefaultBackground}
        />
      </div>

      <div className={s.preview}>
        <PreviewPanel
          draft={builder.draft}
          playerLibrary={builder.playerLibrary}
          sponsors={builder.sponsors}
          clubLogoSrc={builder.clubLogoSrc}
          backgroundImage={builder.backgroundImage}
          activeFormat={builder.activeFormat}
          onFormatChange={builder.setActiveFormat}
        />
      </div>
    </div>
  )
}
