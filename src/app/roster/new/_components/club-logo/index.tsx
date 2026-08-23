"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"

import { toDriveDirectLink } from "../../_helpers/drive-url"

import s from "./styles.module.css"

type ClubLogoPanelProps = {
  /** Raw logo value (URL), or null for the official crest. */
  value: string | null
  /** Resolved src for preview: the set URL or the official crest. */
  clubLogoSrc: string
  onChange: (url: string | null) => void
}

/**
 * Club Logo — paste-only for now (same Drive-link flow as every other image;
 * file upload returns with the Cloudinary migration). Renders in the graphic
 * header and as the photo fallback when a player has no library photo.
 */
export default function ClubLogoPanel({
  value,
  clubLogoSrc,
  onChange,
}: ClubLogoPanelProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const converted = toDriveDirectLink(url)
    if (!converted) {
      setError("Paste a Drive share link or an image URL.")
      return
    }
    setError(null)
    setUrl("")
    onChange(converted)
  }

  return (
    <section className={s.section} aria-labelledby="club-logo-heading">
      <h2 id="club-logo-heading" className={s.heading}>
        Club Logo
      </h2>

      <div className={s.preview}>
        <Image
          src={clubLogoSrc}
          alt="Club Logo"
          fill
          className={s.image}
          loading="eager"
        />
      </div>

      <form className={s.addRow} onSubmit={handleSubmit}>
        <label className={s.field}>
          <span className={s.label}>Drive share link or image URL</span>
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
            Set logo
          </button>
        </div>
      </form>

      {error ? <p className={s.error}>{error}</p> : null}

      {value ? (
        <button
          type="button"
          className={s.clearBtn}
          onClick={() => onChange(null)}
        >
          Reset to crest
        </button>
      ) : null}

      <p className={s.note}>
        Paste a Google Drive share link (converted automatically, like player
        photos) or any image URL. Saved with the Roster.
      </p>
    </section>
  )
}
