"use client"

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import Image from "next/image"

import type { PlayerLibrary } from "../../_static/builder-types"
import { toDriveDirectLink } from "../../_helpers/drive-url"
import { LEAGUE_LABEL, type LeagueId } from "../../../_static/cloud-roster"

import s from "./styles.module.css"

type PlayerLibraryPanelProps = {
  library: PlayerLibrary
  clubLogoSrc: string
  /** Active Roster League — the library is split per League. */
  league: LeagueId | ""
  onUpsert: (name: string, photoUrl: string) => void
  onRemove: (name: string) => void
  /** Rename a library entry; returns an error message or null on success. */
  onRename: (oldName: string, newName: string) => string | null
}

/**
 * Player Library add/remove + list.
 * Drive share links are converted to embeddable URLs on add.
 */
export default function PlayerLibraryPanel({
  library,
  clubLogoSrc,
  league,
  onUpsert,
  onRemove,
  onRename,
}: PlayerLibraryPanelProps) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [renameError, setRenameError] = useState<string | null>(null)

  const names = useMemo(
    () => Object.keys(library).sort((a, b) => a.localeCompare(b)),
    [library]
  )

  if (!league) {
    return (
      <section className={s.section} aria-labelledby="player-library-heading">
        <h2 id="player-library-heading" className={s.heading}>
          Player Photo Library
        </h2>
        <p className={s.empty}>
          Choose a League in Match Details first — the photo library is split by
          League.
        </p>
      </section>
    )
  }

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
        Player Photo Library · {LEAGUE_LABEL[league]}
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
          <button type="submit" className={s.addBtn}>
            Add
          </button>
        </div>
      </form>

      {error ? <p className={s.error}>{error}</p> : null}

      {names.length === 0 ? (
        <p className={s.empty}>No players saved yet — add your squad above.</p>
      ) : (
        <ul className={s.list}>
          {names.map((playerName) => (
            <li key={playerName} className={s.chip}>
              <span className={s.chipThumb}>
                <Image
                  src={library[playerName]}
                  alt=""
                  fill
                  className={s.chipThumbImg}
                  loading="eager"
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = clubLogoSrc
                  }}
                />
              </span>
              <EditableName
                name={playerName}
                onRename={onRename}
                onError={setRenameError}
              />
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

      {renameError ? <p className={s.error}>{renameError}</p> : null}

      <p className={s.note}>
        In Google Drive: right-click the photo → Share → &quot;Anyone with the
        link&quot; → Copy link, then paste it here. Paste any Drive share link —
        it&apos;s converted automatically.
      </p>
      <p className={s.note}>
        Once a player&apos;s added, pick them from the roster below and the
        photo fills in automatically. Click a name to rename it — Roster Slots
        that already use the name update too.
      </p>
      <p className={s.note}>
        {LEAGUE_LABEL[league]} pool — Men&apos;s and Women&apos;s libraries stay
        separate.
      </p>
    </section>
  )
}

type EditableNameProps = {
  name: string
  onRename: (oldName: string, newName: string) => string | null
  /** Surface a rename failure (e.g. duplicate name) at the panel level. */
  onError: (message: string | null) => void
}

/**
 * Click-to-rename player name. Commits on blur or Enter, cancels on Escape;
 * the photo follows the new name via the library rename.
 */
function EditableName({ name, onRename, onError }: EditableNameProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const cancelRef = useRef(false)

  function startEditing() {
    setValue(name)
    cancelRef.current = false
    onError(null)
    setEditing(true)
  }

  function commit() {
    const next = value.trim()
    if (!next || next === name) {
      setEditing(false)
      return
    }
    onError(onRename(name, next))
    setEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      event.currentTarget.blur() // commit via onBlur
    } else if (event.key === "Escape") {
      cancelRef.current = true
      event.currentTarget.blur()
    }
  }

  if (editing) {
    return (
      <input
        type="text"
        className={s.chipNameInput}
        value={value}
        aria-label={`Rename ${name}`}
        autoFocus
        onChange={(event) => setValue(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={() => {
          if (cancelRef.current) {
            cancelRef.current = false
            setEditing(false)
            return
          }
          commit()
        }}
        onKeyDown={handleKeyDown}
      />
    )
  }

  return (
    <button
      type="button"
      className={s.chipName}
      title="Click to rename"
      onClick={startEditing}
    >
      {name}
    </button>
  )
}
