"use client"

import type { Sponsors } from "../../_static/builder-types"
import { SPONSOR_SLOT_COUNT } from "../../_static/builder-types"

import s from "./styles.module.css"

type SponsorsPanelProps = {
  sponsors: Sponsors
  onUpdateSlot: (index: number, dataUrl: string) => void
  onClearSlot: (index: number) => void
}

/**
 * Sponsor logo slots (fixed count).
 * Upload/clear UI lands in the controls-parity ticket.
 */
export default function SponsorsPanel({
  sponsors,
  onUpdateSlot: _onUpdateSlot,
  onClearSlot: _onClearSlot,
}: SponsorsPanelProps) {
  const filled = sponsors.filter(Boolean).length

  return (
    <section className={s.section} aria-labelledby="sponsors-heading">
      <h2 id="sponsors-heading" className={s.heading}>
        Sponsor Logos
      </h2>
      <p className={s.hint}>
        {filled}/{SPONSOR_SLOT_COUNT} slots filled — upload controls wire here.
      </p>
      <ul className={s.slotList}>
        {sponsors.map((src, index) => (
          <li key={index} className={s.slotItem} data-filled={Boolean(src)}>
            {src ? (
              <img src={src} alt="" className={s.thumb} />
            ) : (
              <span className={s.empty}>{index + 1}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
