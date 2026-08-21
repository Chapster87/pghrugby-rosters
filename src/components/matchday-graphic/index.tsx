"use client"

import type {
  Draft,
  PlayerLibrary,
  Sponsors,
} from "../../app/roster/new/_static/builder-types"
import type { GraphicFormat } from "../../app/roster/new/_static/graphic-formats"
import {
  getRosterSlotsByGroup,
  type RosterSlotGroup,
} from "../../app/roster/new/_static/roster-slots"
import { LEAGUE_LABEL } from "../../app/roster/_static/cloud-roster"
import { corsModeForImageSrc } from "../../app/roster/new/_helpers/export-png"
import { formatMatchDate } from "../../app/roster/new/_helpers/format-match-date"
import { resolveSlotPhotoSrc } from "../../app/roster/new/_helpers/resolve-slot-photo"

import s from "./styles.module.css"

export type MatchdayGraphicProps = {
  draft: Draft
  playerLibrary: PlayerLibrary
  sponsors: Sponsors
  clubLogoSrc: string
  /** Background Image URL (Drive-converted), or null for the default. */
  backgroundImage: string | null
  format: GraphicFormat
  /** Optional DOM id for Export capture (stable root; no scale transform). */
  exportRootId?: string
}

type SlotView = {
  /** Stable key from the editor Roster Slot (may skip on finishers). */
  slotNumber: number
  /** Jersey badge shown on the graphic (sequential for finishers). */
  displayNumber: number
  name: string
  position: string
  photoSrc: string
}

/** First jersey number on the bench graphic (after Starting Lineup 1–15). */
const FINISHER_DISPLAY_START = 16

function buildGroupSlots(
  group: RosterSlotGroup,
  draft: Draft,
  playerLibrary: PlayerLibrary,
  clubLogoSrc: string
): SlotView[] {
  let defs = getRosterSlotsByGroup(group)

  // Finishers drop entirely when unfilled — no empty circles on the bench.
  if (group === "finishers") {
    defs = defs.filter((def) => {
      const name = draft.slots[def.number]?.name?.trim() ?? ""
      return Boolean(name)
    })
  }

  return defs.map((def, index) => {
    const value = draft.slots[def.number]
    const name = value?.name?.trim() ?? ""
    const position = (value?.position ?? def.position).trim()
    // Starters keep fixed 1–15. Finishers renumber by filled order so a skipped
    // editor slot does not leave a gap on the graphic (16, 17, 18…).
    const displayNumber =
      group === "finishers" ? FINISHER_DISPLAY_START + index : def.number
    return {
      slotNumber: def.number,
      displayNumber,
      name,
      position,
      photoSrc: resolveSlotPhotoSrc(name, playerLibrary, clubLogoSrc),
    }
  })
}

function buildStarterSlots(
  draft: Draft,
  playerLibrary: PlayerLibrary,
  clubLogoSrc: string
): SlotView[] {
  return [
    ...buildGroupSlots("forwards", draft, playerLibrary, clubLogoSrc),
    ...buildGroupSlots("backs", draft, playerLibrary, clubLogoSrc),
  ]
}

function SlotCell({
  slot,
  clubLogoSrc,
}: {
  slot: SlotView
  clubLogoSrc: string
}) {
  return (
    <div className={s.slot}>
      <div className={s.photoWrap}>
        <img
          src={slot.photoSrc}
          alt=""
          className={s.photo}
          draggable={false}
          crossOrigin={corsModeForImageSrc(slot.photoSrc)}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.removeAttribute("crossorigin")
            event.currentTarget.src = clubLogoSrc
          }}
        />
        <span className={s.jersey} aria-hidden="true">
          {slot.displayNumber}
        </span>
      </div>
      <div className={s.name}>{slot.name || "—"}</div>
      <div className={s.position}>{slot.position}</div>
    </div>
  )
}

/**
 * Full-resolution Matchday Squad graphic for one Graphic Format.
 * Sized at native export pixels; callers scale a wrapper for on-screen preview.
 *
 * Layout (Post + Story):
 * - Starting lineup 1–15 in 3 rows of 5
 * - Finishers in one row of up to 8 (wraps only if bench exceeds 8)
 */
export default function MatchdayGraphic({
  draft,
  playerLibrary,
  sponsors,
  clubLogoSrc,
  backgroundImage,
  format,
  exportRootId,
}: MatchdayGraphicProps) {
  const opponent = draft.opponent.trim() || "TBD Opponent"
  // Home → vs, Away → @ (same convention as buildAutoTitle).
  const matchupMarker = draft.venue === "Away" ? "@" : "vs"
  const dateStr = formatMatchDate(draft.matchDate)
  const kickoff = draft.kickoff.trim()
  // Stored id is mens|womens; graphic shows the display label (Men's / Women's).
  const leagueLabel = draft.league ? LEAGUE_LABEL[draft.league] : ""
  const division = draft.division.trim()
  const address = draft.address.trim()
  const address2 = draft.address2.trim()
  const filledSponsors = sponsors.filter(Boolean)

  const starters = buildStarterSlots(draft, playerLibrary, clubLogoSrc)
  const finishers = buildGroupSlots(
    "finishers",
    draft,
    playerLibrary,
    clubLogoSrc
  )
  // Full default bench is one row of 8; only wrap when Operators add beyond 23.
  const finisherRowsClass = finishers.length > 8 ? s.rows2 : s.rows1

  return (
    <div
      id={exportRootId}
      className={s.root}
      data-format={format.id}
      data-matchday-graphic=""
      style={{ width: format.width, height: format.height }}
      role="img"
      aria-label={`Matchday Squad graphic, ${format.label} ${format.width} by ${format.height}`}
    >
      {backgroundImage ? (
        <img
          src={backgroundImage}
          alt=""
          className={s.background}
          draggable={false}
          crossOrigin={corsModeForImageSrc(backgroundImage)}
          onError={(event) => {
            // A broken backdrop is worse than the default gradient.
            event.currentTarget.style.display = "none"
          }}
        />
      ) : null}
      <header className={s.header}>
        <div className={s.logo}>
          <img
            src={clubLogoSrc}
            alt=""
            draggable={false}
            crossOrigin={corsModeForImageSrc(clubLogoSrc)}
          />
        </div>
        <div className={s.titles}>
          <p className={s.clubName}>PITTSBURGH FORGE</p>
          <p className={s.subTitle}>
            {[leagueLabel, division].filter(Boolean).join(" ")}
            <span className={s.matchup}>
              {matchupMarker} {opponent}
            </span>
          </p>
        </div>
        <div className={s.match}>
          <div>
            {dateStr}
            {kickoff ? ` · ${kickoff}` : ""}
          </div>
          <div>{draft.venue}</div>
          {address ? <div className={s.address}>{address}</div> : null}
          {address2 ? <div className={s.address}>{address2}</div> : null}
        </div>
      </header>

      <section className={s.group}>
        <h3 className={s.groupTitle}>Starters</h3>
        <div className={`${s.grid} ${s.gridStarters}`}>
          {starters.map((slot) => (
            <SlotCell
              key={slot.slotNumber}
              slot={slot}
              clubLogoSrc={clubLogoSrc}
            />
          ))}
        </div>
      </section>

      {finishers.length > 0 ? (
        <section
          className={`${s.group} ${s.groupFinishers} ${finisherRowsClass}`}
        >
          <h3 className={s.groupTitle}>Finishers</h3>
          <div className={`${s.grid} ${s.gridFinishers}`}>
            {finishers.map((slot) => (
              <SlotCell
                key={slot.slotNumber}
                slot={slot}
                clubLogoSrc={clubLogoSrc}
              />
            ))}
          </div>
        </section>
      ) : null}

      {filledSponsors.length > 0 ? (
        <div className={s.sponsors}>
          <div className={s.sponsorsLabel}>Proud Sponsors</div>
          <div className={s.sponsorsLogos}>
            {filledSponsors.map((src, index) => (
              // html2canvas ignores object-fit; background-size: contain
              // preserves logo aspect in the PNG export.
              <div
                key={`sponsor-${index}`}
                className={s.sponsorLogo}
                style={{ backgroundImage: `url("${src}")` }}
                role="img"
                aria-label=""
              />
            ))}
          </div>
        </div>
      ) : null}

      {/*<footer className={s.footer}>FORWARD WITH HONOR · #ForgeRugby</footer>*/}
    </div>
  )
}
