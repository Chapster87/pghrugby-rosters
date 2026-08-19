"use client"

import type {
  Draft,
  PlayerLibrary,
  Sponsors,
} from "../../_static/builder-types"
import {
  GRAPHIC_FORMATS,
  type GraphicFormatId,
} from "../../_static/graphic-formats"

import s from "./styles.module.css"

type PreviewPanelProps = {
  draft: Draft
  playerLibrary: PlayerLibrary
  sponsors: Sponsors
  clubLogoSrc: string
  activeFormat: GraphicFormatId
  onFormatChange: (format: GraphicFormatId) => void
}

/**
 * Live Matchday Squad preview for Portrait + Story.
 * Graphic layout lands in the preview ticket; Export in the export ticket.
 */
export default function PreviewPanel({
  draft,
  playerLibrary: _playerLibrary,
  sponsors,
  clubLogoSrc,
  activeFormat,
  onFormatChange,
}: PreviewPanelProps) {
  const active = GRAPHIC_FORMATS.find((format) => format.id === activeFormat)
  const filledSponsors = sponsors.filter(Boolean).length
  const namedSlots = Object.values(draft.slots).filter((slot) =>
    slot.name.trim()
  ).length

  return (
    <section className={s.section} aria-labelledby="preview-heading">
      <div className={s.toolbar}>
        <h2 id="preview-heading" className={s.heading}>
          Preview
        </h2>
        <div
          className={s.formatTabs}
          role="tablist"
          aria-label="Graphic Format"
        >
          {GRAPHIC_FORMATS.map((format) => {
            const selected = format.id === activeFormat
            return (
              <button
                key={format.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={selected ? s.tabActive : s.tab}
                onClick={() => onFormatChange(format.id)}
              >
                {format.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={s.canvasFrame}>
        <div className={s.canvasMeta}>
          <img src={clubLogoSrc} alt="" className={s.logoThumb} />
          <div>
            <p className={s.metaTitle}>
              {draft.opponent.trim() || "TBD Opponent"}
            </p>
            <p className={s.metaSub}>
              {active
                ? `${active.label} · ${active.width}×${active.height}`
                : null}
            </p>
            <p className={s.metaSub}>
              {namedSlots} named · {filledSponsors} sponsor
              {filledSponsors === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <p className={s.hint}>
          Full Portrait / Story graphic renders here in the preview ticket.
        </p>
      </div>
    </section>
  )
}
