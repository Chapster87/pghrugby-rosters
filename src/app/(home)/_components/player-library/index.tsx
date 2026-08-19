"use client"

import type { PlayerLibrary } from "../../_static/builder-types"

import s from "./styles.module.css"

type PlayerLibraryPanelProps = {
  library: PlayerLibrary
  onUpsert: (name: string, photoUrl: string) => void
  onRemove: (name: string) => void
}

/**
 * Player Library add/remove + list.
 * Interactive controls land in the controls-parity ticket.
 */
export default function PlayerLibraryPanel({
  library,
  onUpsert: _onUpsert,
  onRemove: _onRemove,
}: PlayerLibraryPanelProps) {
  const count = Object.keys(library).length

  return (
    <section className={s.section} aria-labelledby="player-library-heading">
      <h2 id="player-library-heading" className={s.heading}>
        Player Library
      </h2>
      <p className={s.hint}>
        {count === 0
          ? "No players saved yet — add/remove + Drive link helper wires here."
          : `${count} player${count === 1 ? "" : "s"} in library.`}
      </p>
    </section>
  )
}
