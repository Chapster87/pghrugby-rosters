"use client"

import { useMemo, useState, type FormEvent } from "react"

import Button from "@/components/button"

import type { PlayerLibrary } from "../../_static/builder-types"
import { toDriveDirectLink } from "../../_helpers/drive-url"

import s from "./styles.module.css"

type PlayerLibraryPanelProps = {
  library: PlayerLibrary
  clubLogoSrc: string
  onUpsert: (name: string, photoUrl: string) => void
  onRemove: (name: string) => void
}

/**
 * Player Library add/remove + list.
 * Drive share links are converted to embeddable URLs on add.
 */
export default function PlayerLibraryPanel({
  library,
  clubLogoSrc,
  onUpsert,
  onRemove,
}: PlayerLibraryPanelProps) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const names = useMemo(
    () => Object.keys(library).sort((a, b) => a.localeCompare(b)),
    [library]
  )

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const trimmedName = name.trim()
    const embeddableUrl = toDriveDirectLink(url)
    if (!trimmedName || !embeddableUrl) {
      setError("Enter a player name and paste a photo link.")
      return
    }
    onUpsert(trimmedName, embeddableUrl)
    setName("")
    setUrl("")
    setError(null)
  }

  return (
    <section className={s.section} aria-labelledby="player-library-heading">
      <h2 id="player-library-heading" className={s.heading}>
        Player Photo Library
      </h2>

      <form className={s.addRow} onSubmit={handleAdd}>
        <label className={s.field}>
          <span className={s.label}>Player name</span>
          <input
            type="text"
            className={s.input}
            value={name}
            placeholder="Full name"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className={`${s.field} ${s.urlField}`}>
          <span className={s.label}>Photo link (Google Drive)</span>
          <input
            type="text"
            className={s.input}
            value={url}
            placeholder="Paste the Drive share link"
            onChange={(event) => setUrl(event.target.value)}
          />
        </label>
        <div className={s.addAction}>
          <Button type="submit" size="small">
            Add
          </Button>
        </div>
      </form>

      {error ? <p className={s.error}>{error}</p> : null}

      {names.length === 0 ? (
        <p className={s.empty}>No players saved yet — add your squad above.</p>
      ) : (
        <ul className={s.list}>
          {names.map((playerName) => (
            <li key={playerName} className={s.chip}>
              <img
                src={library[playerName]}
                alt=""
                className={s.chipThumb}
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = clubLogoSrc
                }}
              />
              <span className={s.chipName}>{playerName}</span>
              <button
                type="button"
                className={s.removeChip}
                aria-label={`Remove ${playerName} from Player Library`}
                onClick={() => onRemove(playerName)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className={s.note}>
        In Google Drive: right-click the photo → Share → &quot;Anyone with the
        link&quot; → Copy link, then paste it here. Paste any Drive share link —
        it&apos;s converted automatically.
      </p>
      <p className={s.note}>
        Once a player&apos;s added, pick them from the roster below and the
        photo fills in automatically.
      </p>
    </section>
  )
}
