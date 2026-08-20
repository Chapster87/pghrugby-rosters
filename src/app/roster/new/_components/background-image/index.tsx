"use client"

import { useState, type KeyboardEvent } from "react"

import { toDriveDirectLink } from "../../_helpers/drive-url"

import s from "./styles.module.css"

type BackgroundImagePanelProps = {
  /** Current background URL (Drive-converted), or null for the default. */
  value: string | null
  onChange: (url: string | null) => void
}

/**
 * Background Image control — one shared background for Post and Story until
 * the Operator redefines it. Same Drive-link flow as every other image in the
 * app (paste a Drive share link, converted automatically) so the Cloudinary
 * migration swaps one function. Styling of the backdrop itself is the human
 * design track; this delivers the layer + persistence.
 */
export default function BackgroundImagePanel({
  value,
  onChange,
}: BackgroundImagePanelProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  function applyLink(rawUrl: string) {
    const converted = toDriveDirectLink(rawUrl, 1600)
    if (!converted) {
      setError("Paste a Drive share link or an image URL.")
      return
    }
    setError(null)
    setUrl("")
    onChange(converted)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    if (url.trim()) applyLink(url)
  }

  return (
    <section className={s.section} aria-labelledby="background-image-heading">
      <h2 id="background-image-heading" className={s.heading}>
        Background Image
      </h2>

      <div className={s.preview}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- next/image
          // sweep is its own ticket; graphic export relies on plain img + CORS
          <img src={value} alt="" className={s.image} />
        ) : (
          <span className={s.placeholder} aria-hidden="true" />
        )}
      </div>

      <label className={s.field}>
        <span className={s.label}>Drive share link or image URL</span>
        <input
          type="text"
          className={s.input}
          value={url}
          placeholder="Paste the Drive share link, then press Enter"
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </label>

      <div className={s.actions}>
        <button
          type="button"
          className={s.applyBtn}
          onClick={() => {
            if (url.trim()) applyLink(url)
          }}
        >
          Set background
        </button>
        {value ? (
          <button
            type="button"
            className={s.clearBtn}
            onClick={() => onChange(null)}
          >
            Reset to default
          </button>
        ) : null}
      </div>

      {error ? <p className={s.error}>{error}</p> : null}

      <p className={s.note}>
        One shared background for Post and Story until you replace it. Paste a
        Google Drive share link (converted automatically, like player photos)
        or any image URL. Saved with the Roster.
      </p>
    </section>
  )
}
