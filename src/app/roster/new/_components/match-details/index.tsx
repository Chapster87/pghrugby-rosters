"use client"

import type { ChangeEvent } from "react"

import type { LeagueId } from "../../../_static/cloud-roster"
import type { MatchDetails, Venue } from "../../_static/builder-types"

import s from "./styles.module.css"

type MatchDetailsPanelProps = {
  value: MatchDetails
  onChange: (patch: Partial<MatchDetails>) => void
}

/**
 * Match Details controls. The Club Logo lives in its own panel above Sponsors
 * (paste-only; upload returns with the Cloudinary migration).
 */
export default function MatchDetailsPanel({
  value,
  onChange,
}: MatchDetailsPanelProps) {
  function handleVenueChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value
    if (next === "Home" || next === "Away") {
      onChange({ venue: next as Venue })
    }
  }

  function handleLeagueChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value
    if (next === "mens" || next === "womens") {
      onChange({ league: next as LeagueId })
    }
  }

  return (
    <section className={s.section} aria-labelledby="match-details-heading">
      <div className={s.block}>
        <h2 id="match-details-heading" className={s.heading}>
          Match Details
        </h2>

        <div className={s.row2}>
          <label className={s.field}>
            <span className={s.label}>League (required)</span>
            <select
              className={s.input}
              value={value.league}
              onChange={handleLeagueChange}
            >
              <option value="">Select…</option>
              <option value="mens">Men&apos;s</option>
              <option value="womens">Women&apos;s</option>
            </select>
          </label>
          <label className={s.field}>
            <span className={s.label}>Division (optional)</span>
            <input
              type="text"
              className={s.input}
              value={value.division}
              placeholder="e.g. Midwest D1"
              onChange={(event) => onChange({ division: event.target.value })}
            />
          </label>
        </div>

        <label className={s.field}>
          <span className={s.label}>Opponent</span>
          <input
            type="text"
            className={s.input}
            value={value.opponent}
            placeholder="e.g. Columbus Nomads"
            onChange={(event) => onChange({ opponent: event.target.value })}
          />
        </label>

        <div className={s.row2}>
          <label className={s.field}>
            <span className={s.label}>Date</span>
            <input
              type="date"
              className={s.input}
              value={value.matchDate}
              onChange={(event) => onChange({ matchDate: event.target.value })}
            />
          </label>
          <label className={s.field}>
            <span className={s.label}>Kickoff</span>
            <input
              type="time"
              className={s.input}
              value={value.kickoff}
              onChange={(event) => onChange({ kickoff: event.target.value })}
            />
          </label>
        </div>

        <label className={s.field}>
          <span className={s.label}>Home / Away</span>
          <select
            className={s.input}
            value={value.venue}
            onChange={handleVenueChange}
          >
            <option value="Home">Home</option>
            <option value="Away">Away</option>
          </select>
        </label>

        <label className={s.field}>
          <span className={s.label}>Address (optional)</span>
          <input
            type="text"
            className={s.input}
            value={value.address}
            placeholder="e.g. 123 Rugby Way, Pittsburgh, PA 15220"
            onChange={(event) => onChange({ address: event.target.value })}
          />
        </label>
      </div>
    </section>
  )
}
