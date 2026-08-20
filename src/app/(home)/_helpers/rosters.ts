import type { RosterRow } from "../_static/rosters"

/**
 * "Apr 11, 2026" from an ISO date string (`roster_drafts.match_date` is a
 * Postgres `date`). Parsed in UTC so the label never shifts a day by timezone.
 */
export function formatMatchDate(isoDate: string | null): string {
  if (!isoDate) return "TBD"
  const [y, m, d] = isoDate.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** "Apr 9" from an ISO timestamp (`roster_drafts.updated_at`). */
export function formatUpdated(iso: string): string {
  const dt = new Date(iso)
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

/**
 * Secondary line under the title: Home → "vs Opponent", Away → "@ Opponent".
 * Venue lives in `state.match.venue` ("Home" | "Away"); opponent is a column.
 */
export function opponentPhrase(row: RosterRow): string {
  const opponent = row.opponent?.trim()
  if (!opponent) return "—"
  const venue = row.state?.match?.venue
  if (venue === "Home") return `vs ${opponent}`
  if (venue === "Away") return `@ ${opponent}`
  return opponent
}
