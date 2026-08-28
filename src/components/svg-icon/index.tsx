import React from "react"
import clsx from "clsx"

/**
 * Inline feather-style icon set. Same API as the cms-starter `SvgIcon`
 * (`icon` id, `size`/`width`/`height`) but renders paths inline instead of
 * referencing a global sprite. `globals.css` strokes anything carrying the
 * `feather-icon` class (stroke: currentColor, 2px, round caps).
 */
const ICON_PATHS: Record<SvgIconName, React.ReactNode> = {
  "more-vertical": (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  "trash-2": (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  "external-link": (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),
}

export type SvgIconName = "more-vertical" | "copy" | "trash-2" | "external-link"

interface SvgIconProps {
  /** Icon id from the inline set (feather-style ids, e.g. 'more-vertical'). */
  icon: SvgIconName
  /** Square size of the icon in pixels. Defaults to 24. */
  size?: number | string
  /** Optional width override */
  width?: number | string
  /** Optional height override */
  height?: number | string
  /** Optional CSS class name */
  className?: string
}

export default function SvgIcon({
  icon,
  size = 24,
  width,
  height,
  className,
}: SvgIconProps) {
  const iconWidth = width || size
  const iconHeight = height || size

  return (
    <svg
      className={clsx("feather-icon", className)}
      width={iconWidth}
      height={iconHeight}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {ICON_PATHS[icon]}
    </svg>
  )
}
