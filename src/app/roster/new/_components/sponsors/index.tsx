"use client"

import type { ChangeEvent } from "react"

import type { Sponsors } from "../../_static/builder-types"
import { SPONSOR_SLOT_COUNT } from "../../_static/builder-types"
import { readImageFileAsDataUrl } from "../../_helpers/read-image-file"

import s from "./styles.module.css"

type SponsorsPanelProps = {
  sponsors: Sponsors
  onUpdateSlot: (index: number, dataUrl: string) => void
  onClearSlot: (index: number) => void
}

/**
 * Sponsor logo slots (fixed count).
 * Upload as many as you have — only filled slots show on the graphic later.
 */
export default function SponsorsPanel({
  sponsors,
  onUpdateSlot,
  onClearSlot,
}: SponsorsPanelProps) {
  async function handleFileChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readImageFileAsDataUrl(file)
      onUpdateSlot(index, dataUrl)
    } catch {
      // Ignore unreadable files.
    }
  }

  function handleClear(index: number) {
    onClearSlot(index)
  }

  return (
    <section className={s.section} aria-labelledby="sponsors-heading">
      <h2 id="sponsors-heading" className={s.heading}>
        Sponsor Logos
      </h2>
      <ul className={s.slotList}>
        {sponsors.map((src, index) => (
          <li key={index} className={s.slotRow} data-filled={Boolean(src)}>
            <span className={s.num} aria-hidden="true">
              {index + 1}
            </span>
            <label className={s.fileLabel}>
              <span className={s.srOnly}>Sponsor logo {index + 1}</span>
              <input
                key={src ? `filled-${index}` : `empty-${index}`}
                type="file"
                accept="image/*"
                className={s.fileInput}
                onChange={(event) => handleFileChange(index, event)}
              />
            </label>
            {src ? (
              <img src={src} alt="" className={s.thumb} />
            ) : (
              <span className={s.thumbSlot} aria-hidden="true" />
            )}
            {src ? (
              <button
                type="button"
                className={s.clearBtn}
                aria-label={`Clear sponsor logo ${index + 1}`}
                onClick={() => handleClear(index)}
              >
                ✕
              </button>
            ) : (
              <span className={s.clearSlot} aria-hidden="true" />
            )}
          </li>
        ))}
      </ul>
      <p className={s.hint}>
        Upload as many as you have (up to {SPONSOR_SLOT_COUNT}) — only filled
        slots show, spread evenly along the bottom of both graphics. Saved in
        this browser and reused every week.
      </p>
    </section>
  )
}
