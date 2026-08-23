"use client"

import { useState, type KeyboardEvent } from "react"
import Image from "next/image"

import { toDriveDirectLink } from "../../_helpers/drive-url"

import s from "./styles.module.css"

type BackgroundImagePanelProps = {
  /** Current background URL (Drive-converted), or null for the default. */
  value: string | null
  /** False = following the shared default; true = custom to this Roster. */
  isCustom: boolean
  onChange: (url: string | null) => void
  /** Stop customizing and re-apply the shared default background. */
  onUseDefault: () => void
  /** Save the working background as the app-wide default. */
  onSaveDefault: () => Promise<void>
}

/**
 * Background Image control — one shared background for Post and Story, saved
 * as a cloud default that new Rosters start from until redefined (same flow as
 * league-default sponsors, but not League-split). Same Drive-link paste flow as
 * every other image. Styling of the backdrop itself is the human design track.
 */
export default function BackgroundImagePanel({
  value,
  isCustom,
  onChange,
  onUseDefault,
  onSaveDefault,
}: BackgroundImagePanelProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  function applyLink(rawUrl: string) {
    const converted = toDriveDirectLink(rawUrl, 1600)
    if (!converted) {
      setError("Paste a Drive share link or an image URL.")
      return
    }
    setError(null)
    setSaveMsg(null)
    setUrl("")
    onChange(converted)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    if (url.trim()) applyLink(url)
  }

  async function handleSaveDefault() {
    setSaveMsg(null)
    setError(null)
    try {
      await onSaveDefault()
      setSaveMsg("Saved as the default background.")
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the default background."
      )
    }
  }

  return (
    <section className={s.section} aria-labelledby="background-image-heading">
      <h2 id="background-image-heading" className={s.heading}>
        Background Image
      </h2>

      <div className={s.preview}>
        {value ? (
          <Image src={value} alt="" fill className={s.image} loading="eager" />
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
        {isCustom ? (
          <button type="button" className={s.clearBtn} onClick={onUseDefault}>
            Reset to default
          </button>
        ) : null}
      </div>

      {error ? <p className={s.error}>{error}</p> : null}
      {saveMsg ? <p className={s.note}>{saveMsg}</p> : null}

      <div className={s.defaultsRow}>
        <button
          type="button"
          className={s.defaultsBtn}
          onClick={handleSaveDefault}
        >
          Save as default background
        </button>
      </div>

      <p className={s.note}>
        One shared background for Post and Story. New Rosters start from the
        default until you change it; saved Rosters keep what they had. Paste a
        Google Drive share link (converted automatically, like player photos) or
        any image URL.
      </p>
    </section>
  )
}
