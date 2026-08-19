/**
 * Converts a normal Google Drive share link into a directly-embeddable image URL.
 *
 * Drive's own image URLs don't send the CORS headers needed to export a canvas PNG,
 * and they often block hotlinking. Routing through images.weserv.nl returns the same
 * photo in a form that is reliably embeddable (and CORS-friendly for html2canvas).
 * Non-Drive URLs pass through unchanged.
 */
export function toDriveDirectLink(url: string): string {
  const trimmed = (url || "").trim()
  if (!trimmed) return trimmed

  const match =
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)

  if (match?.[1]) {
    const driveUrl = `drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
    return `https://images.weserv.nl/?url=${encodeURIComponent(driveUrl)}`
  }

  return trimmed
}
