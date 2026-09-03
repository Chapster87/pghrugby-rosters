"use client"

import { useMemo, useState } from "react"
import Link from "@/components/link"
import type { GraphicFormatId } from "../../new/_static/graphic-formats"
import { FIXED_SLOT_MAX, LEAGUE_LABEL, type CloudRosterRow } from "../../_static/cloud-roster"
import { deserializeRoster } from "../../_helpers/cloud-roster"
import { formatMatchDate } from "../../new/_helpers/format-match-date"
import { formatKickoff } from "../../new/_helpers/format-kickoff"
import PreviewPanel from "../../new/_components/preview"

import s from "./style.module.css"

type RosterViewerProps = {
  row: CloudRosterRow
}

const DEFAULT_CLUB_LOGO = "/images/pittsburgh-forge-crest.png"

/**
 * Read-only Reviewer view for `/roster/<uuid>/`.
 *
 * Provides a preview-first view with full Graphic Format toggle and PNG export,
 * a clean Match Details summary, and a sign-in callout for authorized Operators.
 * Excludes all editor inputs, tabs, library controls, Save, and Delete.
 */
export default function RosterViewer({ row }: RosterViewerProps) {
  const deserialized = useMemo(() => deserializeRoster(row), [row])
  const [activeFormat, setActiveFormat] = useState<GraphicFormatId>(
    deserialized.activeFormat
  )

  const { draft, sponsors, clubLogo, backgroundImage } = deserialized
  const clubLogoSrc = clubLogo || DEFAULT_CLUB_LOGO

  const leagueLabel = draft.league ? LEAGUE_LABEL[draft.league] : "Pittsburgh Forge"
  const dateStr = formatMatchDate(draft.matchDate)
  const kickoffStr = formatKickoff(draft.kickoff)
  const matchupMarker = draft.venue === "Away" ? "@" : "vs"
  const opponent = draft.opponent.trim() || "TBD Opponent"

  const starterCount = useMemo(() => {
    let count = 0
    for (let i = 1; i <= FIXED_SLOT_MAX; i++) {
      if (draft.slots[i]?.name?.trim()) count++
    }
    return count
  }, [draft.slots])

  const finisherCount = useMemo(() => {
    let count = 0
    for (const [numStr, slot] of Object.entries(draft.slots)) {
      if (Number(numStr) > FIXED_SLOT_MAX && slot.name.trim()) count++
    }
    return count
  }, [draft.slots])

  const hasLocation = Boolean(
    draft.locationName.trim() || draft.address.trim() || draft.address2.trim()
  )

  return (
    <div className={s.shell}>
      <div className={s.details}>
        <div className={s.header}>
          <div className={s.badgeRow}>
            {draft.league ? (
              <span className={s.leagueBadge}>
                {leagueLabel}
                {draft.division ? ` · ${draft.division}` : ""}
              </span>
            ) : null}
            <span className={s.matchTypeBadge}>
              {draft.matchType} Match
            </span>
          </div>
          <h1 className={s.title}>
            {matchupMarker} {opponent}
          </h1>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionHeading}>Fixture Information</h2>
          <ul className={s.infoList}>
            <li className={s.infoItem}>
              <span className={s.infoLabel}>Date & Time</span>
              <span className={s.infoValue}>
                {dateStr}
                {kickoffStr ? ` · ${kickoffStr}${draft.timezone ? ` ${draft.timezone}` : ""}` : ""}
              </span>
            </li>
            <li className={s.infoItem}>
              <span className={s.infoLabel}>Venue</span>
              <span className={s.infoValue}>{draft.venue} Match</span>
            </li>
            {hasLocation ? (
              <li className={s.infoItem}>
                <span className={s.infoLabel}>Field Location</span>
                <div className={s.addressBlock}>
                  {draft.locationName ? <div>{draft.locationName}</div> : null}
                  {draft.address ? <div>{draft.address}</div> : null}
                  {draft.address2 ? <div>{draft.address2}</div> : null}
                </div>
              </li>
            ) : null}
          </ul>
        </div>

        <div className={s.section}>
          <h2 className={s.sectionHeading}>Matchday Squad</h2>
          <div className={s.squadStats}>
            <div className={s.statCard}>
              <span className={s.statNumber}>{starterCount} / 15</span>
              <span className={s.statLabel}>Starters Named</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statNumber}>{finisherCount}</span>
              <span className={s.statLabel}>Finishers Named</span>
            </div>
          </div>
        </div>

        <div className={s.authCallout}>
          <h3 className={s.authCalloutTitle}>Operator Access</h3>
          <p className={s.authCalloutBody}>
            Signed-in Forge coaches and admins can edit squad lineups, player photos,
            match details, and branding.
          </p>
          <Link
            href={`/sign-in/?returnTo=${encodeURIComponent(`/roster/${row.id}/`)}`}
            buttonStyle
            size="small"
          >
            Sign in to edit
          </Link>
        </div>
      </div>

      <div className={s.preview}>
        <PreviewPanel
          draft={draft}
          playerLibrary={{}}
          sponsors={sponsors}
          clubLogoSrc={clubLogoSrc}
          backgroundImage={backgroundImage}
          activeFormat={activeFormat}
          onFormatChange={setActiveFormat}
        />
      </div>
    </div>
  )
}
