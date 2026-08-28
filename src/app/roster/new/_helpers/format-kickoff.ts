/**
 * Format a time input value (HH:mm or HH:mm:ss) as 12-hour clock for the graphic.
 * Empty → ""; unrecognized values fall back to the raw string.
 *
 * Examples: "14:30" → "2:30 PM", "09:05" → "9:05 AM", "00:00" → "12:00 AM"
 */
export function formatKickoff(kickoff: string): string {
  const trimmed = kickoff.trim()
  if (!trimmed) return ""

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed)
  if (!match) return trimmed

  const hours24 = Number(match[1])
  const minutes = match[2]
  if (
    !Number.isInteger(hours24) ||
    hours24 < 0 ||
    hours24 > 23 ||
    Number(minutes) > 59
  ) {
    return trimmed
  }

  const period = hours24 >= 12 ? "PM" : "AM"
  const hours12 = hours24 % 12 || 12
  return `${hours12}:${minutes} ${period}`
}
