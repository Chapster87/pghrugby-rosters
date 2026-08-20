"use client"

import type { ChangeEvent } from "react"

import type { LeagueId } from "../../../_static/cloud-roster"
import type { MatchDetails, Venue } from "../../_static/builder-types"
import { readImageFileAsDataUrl } from "../../_helpers/read-image-file"

import s from "./styles.module.css"

type MatchDetailsPanelProps = {
  value: MatchDetails
  onChange: (patch: Partial<MatchDetails>) => void
  clubLogoSrc: string
  onClubLogoChange: (dataUrl: string | null) => void
}

/**
 * Match Details + Club Logo controls.
 * Club Logo upload is saved in the browser and reused every week.
 */
export default function MatchDetailsPanel({
  value,
  onChange,
  clubLogoSrc,
  onClubLogoChange,
}: MatchDetailsPanelProps) {
  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readImageFileAsDataUrl(file)
      onClubLogoChange(dataUrl)
    } catch {
      // Ignore unreadable files; Operator can retry.
    }
  }

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
        <h2 className={s.heading}>Club Logo</h2>
        <div className={s.logoUpload}>
          <div className={s.logoPreview}>
            <img src={clubLogoSrc} alt="Club Logo" className={s.logoImage} />
          </div>
          <div className={s.logoControls}>
            <label className={s.fileLabel}>
              <span className={s.fileLabelText}>Upload logo</span>
              <input
                type="file"
                accept="image/*"
                className={s.fileInput}
                onChange={handleLogoChange}
              />
            </label>
            <p className={s.note}>
              Upload once — it&apos;s saved in this browser and reused every
              week.
            </p>
          </div>
        </div>
      </div>

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
