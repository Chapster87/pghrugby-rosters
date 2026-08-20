import type { Draft } from "../_static/builder-types"
import type { GraphicFormat } from "../_static/graphic-formats"

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

/** Slug fragment safe for weekly social filenames. */
function slugPart(value: string, maxLen = 32): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
}

/**
 * Sensible weekly social filename, e.g.
 * `pittsburgh-forge-roster-portrait.png` or
 * `pittsburgh-forge-roster-vs-old-as-2026-03-22-story.png`.
 */
export function buildExportFilename(
  format: GraphicFormat,
  draft: Pick<Draft, "opponent" | "matchDate">
): string {
  const parts = ["pittsburgh-forge-roster"]

  const opponent = slugPart(draft.opponent)
  if (opponent) parts.push("vs", opponent)

  const date = draft.matchDate.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) parts.push(date)

  parts.push(format.id)

  return `${parts.join("-")}.png`
}

/**
 * `crossOrigin` for graphic `<img>` tags so html2canvas can keep the canvas clean.
 * data:/blob: URLs stay origin-clean without CORS mode; remote http(s) need it.
 */
export function corsModeForImageSrc(
  src: string
): "anonymous" | undefined {
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
