import type { Draft } from "../_static/builder-types"
import type { GraphicFormat } from "../_static/graphic-formats"
import { LEAGUE_LABEL } from "../../_static/cloud-roster"

/**
 * Capture a full-resolution Matchday Squad graphic root as a PNG download.
 *
 * Mirrors the HTML builder: clone offscreen (so preview CSS scale is not baked
 * in), run html2canvas with CORS, then trigger a file download.
 * Dynamic import keeps the library out of SSR/prerender.
 */
export async function exportElementAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default

  const width = element.offsetWidth || element.clientWidth
  const height = element.offsetHeight || element.clientHeight

  const clone = element.cloneNode(true) as HTMLElement
  clone.removeAttribute("id")
  clone.style.position = "absolute"
  clone.style.left = "-99999px"
  clone.style.top = "0"
  clone.style.transform = "none"
  clone.style.margin = "0"
  clone.style.width = `${width}px`
  clone.style.height = `${height}px`

  document.body.appendChild(clone)

  try {
    const canvas = await html2canvas(clone, {
      backgroundColor: null,
      scale: 1,
      useCORS: true,
      allowTaint: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
    })

    const link = document.createElement("a")
    link.download = filename
    link.href = canvas.toDataURL("image/png")
    link.click()
  } finally {
    clone.remove()
  }
}

/** Filename segment: keep alphanumerics; collapse the rest to a single dash. */
function filePart(value: string, maxLen = 32): string {
  return value
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
}

/** `YYYY-MM-DD` → `MMDDYY` for the export filename; empty/invalid → today local. */
function formatFilenameDate(matchDate: string): string {
  const trimmed = matchDate.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [, y, m, d] = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? []
    if (y && m && d) return `${m}${d}${y.slice(-2)}`
  }
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const yy = String(now.getFullYear()).slice(-2)
  return `${mm}${dd}${yy}`
}

/**
 * Weekly social filename: `MMDDYY-League-Division.png`
 * e.g. `082926-Womens-D2.png`. Division omitted when empty.
 * Format id is unused in the name (one matchday graphic per export).
 */
export function buildExportFilename(
  _format: GraphicFormat,
  draft: Pick<Draft, "league" | "division" | "matchDate">
): string {
  const parts = [formatFilenameDate(draft.matchDate)]

  const league =
    draft.league && LEAGUE_LABEL[draft.league]
      ? filePart(LEAGUE_LABEL[draft.league])
      : ""
  if (league) parts.push(league)

  const division = filePart(draft.division)
  if (division) parts.push(division)

  return `${parts.join("-")}.png`
}

/**
 * `crossOrigin` for graphic `<img>` tags so html2canvas can keep the canvas clean.
 * data:/blob: URLs stay origin-clean without CORS mode; remote http(s) need it.
 */
export function corsModeForImageSrc(src: string): "anonymous" | undefined {
  const value = (src || "").trim()
  if (!value) return undefined
  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("/")
  ) {
    return undefined
  }
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//")
  ) {
    return "anonymous"
  }
  return undefined
}
