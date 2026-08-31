"use client"

import * as Tabs from "@radix-ui/react-tabs"

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
 * Mk.2 editor: Variant C segmented tabs over the controls column, Mk.1
 * Preview panel on the right. Shared by `/roster/new/` and `/roster/<uuid>/`.
 * Primary Save / New / menu actions live in each shell's document strip.
 */
export default function RosterEditor({ builder }: RosterEditorProps) {
  return (
    <div className={s.shell} data-ready={builder.isReady}>
      <Tabs.Root className={s.controls} defaultValue="match">
        <Tabs.List className={s.tabList} aria-label="Roster editor sections">
          <Tabs.Trigger className={s.tab} value="match">
            Match
          </Tabs.Trigger>
          <Tabs.Trigger className={s.tab} value="squad">
            Squad
          </Tabs.Trigger>
          <Tabs.Trigger className={s.tab} value="library">
            Library
          </Tabs.Trigger>
          <Tabs.Trigger className={s.tab} value="branding">
            Branding
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className={s.tabPanel} value="match">
          <MatchDetailsPanel
            value={builder.draft}
            onChange={builder.updateMatchDetails}
          />
        </Tabs.Content>

        <Tabs.Content className={s.tabPanel} value="squad">
          <RosterSlotsPanel
            draft={builder.draft}
            playerLibrary={builder.playerLibrary}
            onSlotChange={builder.updateRosterSlot}
          />
        </Tabs.Content>

        <Tabs.Content className={s.tabPanel} value="library">
          <PlayerLibraryPanel
            library={builder.playerLibrary}
            clubLogoSrc={builder.clubLogoSrc}
            league={builder.draft.league}
            onUpsert={builder.upsertPlayerLibraryEntry}
            onRemove={builder.removePlayerLibraryEntry}
            onRename={builder.renamePlayerLibraryEntry}
          />
        </Tabs.Content>

        <Tabs.Content className={s.tabPanel} value="branding">
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
        </Tabs.Content>
      </Tabs.Root>

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
