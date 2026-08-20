/**
 * Format a date input value (YYYY-MM-DD) for the graphic header.
 * Empty → "Date TBD"; invalid values fall back to the raw string.
 */
export function formatMatchDate(matchDate: string): string {
  const trimmed = matchDate.trim()
  if (!trimmed) return "Date TBD"

  const parsed = new Date(`${trimmed}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return trimmed

  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}
