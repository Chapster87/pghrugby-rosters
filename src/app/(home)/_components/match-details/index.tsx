"use client"

import type { MatchDetails } from "../../_static/builder-types"

import s from "./styles.module.css"

type MatchDetailsPanelProps = {
  value: MatchDetails
  onChange: (patch: Partial<MatchDetails>) => void
  clubLogoSrc: string
  onClubLogoChange: (dataUrl: string | null) => void
}

/**
 * Match Details + Club Logo controls.
 * Full field UI lands in the controls-parity ticket; this is the composition seam.
 */
export default function MatchDetailsPanel({
  value,
  onChange: _onChange,
  clubLogoSrc,
  onClubLogoChange: _onClubLogoChange,
}: MatchDetailsPanelProps) {
  return (
    <section className={s.section} aria-labelledby="match-details-heading">
      <h2 id="match-details-heading" className={s.heading}>
        Match Details
      </h2>
      <div className={s.placeholderRow}>
        <div className={s.logoPreview}>
          <img src={clubLogoSrc} alt="Club Logo" className={s.logoImage} />
        </div>
        <p className={s.hint}>
          Club Logo, opponent, date, kickoff, venue, competition, and address
          controls wire here.
          {value.opponent ? ` Current opponent: ${value.opponent}` : null}
        </p>
      </div>
    </section>
  )
}
