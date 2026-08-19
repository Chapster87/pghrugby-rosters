"use client"

import type {
  Draft,
  PlayerLibrary,
  Sponsors,
} from "../../../../_static/builder-types"
import type { GraphicFormat } from "../../../../_static/graphic-formats"
import {
  ROSTER_SLOT_GROUPS,
  getRosterSlotsByGroup,
  type RosterSlotDefinition,
  type RosterSlotGroup,
} from "../../../../_static/roster-slots"
import { formatMatchDate } from "../../../../_helpers/format-match-date"
import { resolveSlotPhotoSrc } from "../../../../_helpers/resolve-slot-photo"

import s from "./styles.module.css"

export type MatchdayGraphicProps = {
  draft: Draft
  playerLibrary: PlayerLibrary
  sponsors: Sponsors
  clubLogoSrc: string
  format: GraphicFormat
  /** Optional DOM id for Export capture (stable root; no scale transform). */
  exportRootId?: string
}

type SlotView = {
  def: RosterSlotDefinition
  name: string
  position: string
  photoSrc: string
}

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

  return defs.map((def) => {
    const value = draft.slots[def.number]
    const name = value?.name?.trim() ?? ""
    const position = (value?.position ?? def.position).trim()
    return {
      def,
      name,
      position,
      photoSrc: resolveSlotPhotoSrc(name, playerLibrary, clubLogoSrc),
    }
  })
}

function gridClassForGroup(group: RosterSlotGroup, count: number): string {
  if (group === "finishers") return s.gridFlex
  if (count === 8) return s.grid8
  return s.grid7
}

/**
 * Full-resolution Matchday Squad graphic for one Graphic Format.
 * Sized at native export pixels; callers scale a wrapper for on-screen preview.
 */
export default function MatchdayGraphic({
  draft,
  playerLibrary,
  sponsors,
  clubLogoSrc,
  format,
  exportRootId,
}: MatchdayGraphicProps) {
  const opponent = draft.opponent.trim() || "TBD Opponent"
  const dateStr = formatMatchDate(draft.matchDate)
  const kickoff = draft.kickoff.trim()
  const competition = draft.competition.trim()
  const address = draft.address.trim()
  const filledSponsors = sponsors.filter(Boolean)

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
      <header className={s.header}>
        <div className={s.logo}>
          <img src={clubLogoSrc} alt="" draggable={false} />
        </div>
        <div className={s.titles}>
          <p className={s.clubName}>PITTSBURGH FORGE</p>
          <p className={s.graphicTitle}>Matchday Squad</p>
        </div>
        <div className={s.match}>
          <div>
            <b>vs</b> {opponent}
          </div>
          <div>
            {dateStr}
            {kickoff ? ` · ${kickoff}` : ""}
          </div>
          <div>
            {draft.venue}
            {competition ? ` · ${competition}` : ""}
          </div>
          {address ? <div className={s.address}>{address}</div> : null}
        </div>
      </header>

      {ROSTER_SLOT_GROUPS.map((group) => {
        const slots = buildGroupSlots(
          group.id,
          draft,
          playerLibrary,
          clubLogoSrc
        )
        if (slots.length === 0) return null

        const isFinishers = group.id === "finishers"
        const rowsClass = isFinishers
          ? slots.length > 4
            ? s.rows2
            : s.rows1
          : undefined
        const gridClass = gridClassForGroup(group.id, slots.length)
        const groupClassName = [
          s.group,
          isFinishers ? s.groupFinishers : null,
          rowsClass,
        ]
          .filter(Boolean)
          .join(" ")

        return (
          <section key={group.id} className={groupClassName}>
            <h3 className={s.groupTitle}>{group.label}</h3>
            <div className={`${s.grid} ${gridClass}`}>
              {slots.map((slot) => (
                <div key={slot.def.number} className={s.slot}>
                  <div className={s.photoWrap}>
                    <img
                      src={slot.photoSrc}
                      alt=""
                      className={s.photo}
                      draggable={false}
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = clubLogoSrc
                      }}
                    />
                    <span className={s.jersey} aria-hidden="true">
                      {slot.def.number}
                    </span>
                  </div>
                  <div className={s.name}>{slot.name || "—"}</div>
                  <div className={s.position}>{slot.position}</div>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {filledSponsors.length > 0 ? (
        <div className={s.sponsors}>
          <div className={s.sponsorsLabel}>Proud Sponsors</div>
          <div className={s.sponsorsLogos}>
            {filledSponsors.map((src, index) => (
              <img
                key={`sponsor-${index}`}
                src={src}
                alt=""
                draggable={false}
              />
            ))}
          </div>
        </div>
      ) : null}

      <footer className={s.footer}>FORWARD WITH HONOR · #ForgeRugby</footer>
    </div>
  )
}
