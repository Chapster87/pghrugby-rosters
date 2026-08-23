"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"

import type { Sponsors } from "../../_static/builder-types"
import { SPONSOR_SLOT_COUNT } from "../../_static/builder-types"
import { toDriveDirectLink } from "../../_helpers/drive-url"
import { LEAGUE_LABEL, type LeagueId } from "../../../_static/cloud-roster"

import s from "./styles.module.css"

type SponsorsPanelProps = {
  sponsors: Sponsors
  /** False = sponsors follow league defaults; true = custom set. */
  isCustom: boolean
  league: LeagueId | ""
  onUpdateSlot: (index: number, dataUrl: string) => void
  onClearSlot: (index: number) => void
  /** Move a sponsor logo earlier/later among filled slots (customizes). */
  onReorder: (next: Sponsors) => void
  /** Re-apply the current League's defaults (also unfreezes custom). */
  onUseLeagueDefaults: () => void
  /** Save the working sponsor set as the current League's defaults. */
  onSaveLeagueDefaults: () => Promise<void>
}

/**
 * Sponsor logo slots (fixed count). Same flow as the Player Library: paste a
 * Drive share link or image URL and click Add — each filled slot renders as a
 * pill with a remove button. File upload is parked until the Cloudinary
 * migration gives uploads a durable home. While not custom, the set follows
 * the League defaults; editing a slot freezes it to this Roster.
 */
export default function SponsorsPanel({
  sponsors,
  isCustom,
  league,
  onUpdateSlot,
  onClearSlot,
  onReorder,
  onUseLeagueDefaults,
  onSaveLeagueDefaults,
}: SponsorsPanelProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const filledCount = sponsors.filter(Boolean).length
  const leagueLabel = league ? LEAGUE_LABEL[league] : ""

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const converted = toDriveDirectLink(url)
    if (!converted) {
      setError("Paste a Drive share link or an image URL.")
      return
    }
    if (filledCount >= SPONSOR_SLOT_COUNT) {
      setError(
        `All ${SPONSOR_SLOT_COUNT} sponsor slots are filled — remove one first.`
      )
      return
    }
    const nextIndex = sponsors.findIndex((src) => !src)
    onUpdateSlot(nextIndex, converted)
    setUrl("")
    setError(null)
    setSaveMsg(null)
  }

  async function handleSaveDefaults() {
    setSaveMsg(null)
    setError(null)
    try {
      await onSaveLeagueDefaults()
      setSaveMsg(`Saved as ${leagueLabel} defaults.`)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save league defaults."
      )
    }
  }

  /** Nearest filled slot in a direction (skips empty slots), or -1. */
  function findFilledNeighbor(fromIndex: number, direction: -1 | 1): number {
    let toIndex = fromIndex + direction
    while (toIndex >= 0 && toIndex < sponsors.length && !sponsors[toIndex]) {
      toIndex += direction
    }
    return toIndex >= 0 && toIndex < sponsors.length ? toIndex : -1
  }

  function handleMove(fromIndex: number, direction: -1 | 1) {
    const toIndex = findFilledNeighbor(fromIndex, direction)
    if (toIndex === -1) return
    const next = [...sponsors]
    const moved = next[fromIndex]
    next[fromIndex] = next[toIndex]
    next[toIndex] = moved
    onReorder(next)
  }

  return (
    <section className={s.section} aria-labelledby="sponsors-heading">
      <h2 id="sponsors-heading" className={s.heading}>
        Sponsor Logos
      </h2>

      <form className={s.addRow} onSubmit={handleAdd}>
        <label className={s.field}>
          <span className={s.label}>Logo link (Google Drive)</span>
          <input
            type="text"
            className={s.input}
            value={url}
            placeholder="Paste the Drive share link"
            onChange={(event) => setUrl(event.target.value)}
          />
        </label>
        <div className={s.addAction}>
          <button type="submit" className={s.addBtn}>
            Add
          </button>
        </div>
      </form>

      {error ? <p className={s.error}>{error}</p> : null}

      {filledCount === 0 ? (
        <p className={s.empty}>No sponsor logos yet — add them above.</p>
      ) : (
        <ul className={s.list}>
          {sponsors.map((src, index) =>
            src ? (
              <li key={index} className={s.chip}>
                <span className={s.chipThumb}>
                  <Image
                    src={src}
                    alt=""
                    fill
                    className={s.chipThumbImg}
                    loading="eager"
                  />
                </span>
                <div className={s.chipControls}>
                  <button
                    type="button"
                    className={s.moveBtn}
                    aria-label={`Move sponsor logo ${index + 1} earlier`}
                    disabled={findFilledNeighbor(index, -1) === -1}
                    onClick={() => handleMove(index, -1)}
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    className={s.moveBtn}
                    aria-label={`Move sponsor logo ${index + 1} later`}
                    disabled={findFilledNeighbor(index, 1) === -1}
                    onClick={() => handleMove(index, 1)}
                  >
                    ▶
                  </button>
                </div>
                <button
                  type="button"
                  className={s.removeChip}
                  aria-label={`Remove sponsor logo ${index + 1}`}
                  onClick={() => onClearSlot(index)}
                >
                  ✕
                </button>
              </li>
            ) : null
          )}
        </ul>
      )}

      <div className={s.defaultsRow}>
        <button
          type="button"
          className={s.defaultsBtn}
          onClick={onUseLeagueDefaults}
          disabled={!league || !isCustom}
        >
          Use {leagueLabel} defaults
        </button>
        <button
          type="button"
          className={s.defaultsBtn}
          onClick={handleSaveDefaults}
          disabled={!league}
        >
          Save as {leagueLabel} defaults
        </button>
      </div>

      {saveMsg ? <p className={s.note}>{saveMsg}</p> : null}
      {isCustom && league ? (
        <p className={s.note}>
          Custom set — saved with this Roster. Use {leagueLabel} defaults to
          follow them again.
        </p>
      ) : null}

      <p className={s.note}>
        Paste a Drive share link or image URL (converted automatically, like
        player photos). Up to {SPONSOR_SLOT_COUNT} — filled slots spread evenly
        along the bottom of both graphics and save with the Roster. New Rosters
        start from the {leagueLabel ? `${leagueLabel} ` : ""}defaults until you
        change them.
      </p>
    </section>
  )
}
