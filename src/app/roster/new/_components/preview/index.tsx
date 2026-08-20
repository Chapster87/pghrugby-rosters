"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

import Button from "@/components/button"

import type {
  Draft,
  PlayerLibrary,
  Sponsors,
} from "../../_static/builder-types"
import {
  GRAPHIC_FORMATS,
  type GraphicFormatId,
} from "../../_static/graphic-formats"
import {
  buildExportFilename,
  exportElementAsPng,
} from "../../_helpers/export-png"
import MatchdayGraphic from "./_components/matchday-graphic"

import s from "./styles.module.css"

/** Stable DOM id on the native-pixel graphic root for Export capture. */
export const MATCHDAY_GRAPHIC_EXPORT_ROOT_ID = "matchday-graphic-export-root"

/** Sticky offset from viewport top (CSS `top`). */
const STICKY_TOP_PX = 20
/** Space under the panel when stuck / at rest. */
const BOTTOM_GAP_PX = 20
/** Home page vertical padding (see `(home)/styles.module.css`). */
const PAGE_PAD_Y_PX = 20

type PreviewPanelProps = {
  draft: Draft
  playerLibrary: PlayerLibrary
  sponsors: Sponsors
  clubLogoSrc: string
  backgroundImage: string | null
  activeFormat: GraphicFormatId
  onFormatChange: (format: GraphicFormatId) => void
}

/**
 * Live Matchday Squad preview for Portrait + Story.
 * Whole sticky card stays on-screen at a stable height (viewport − header −
 * gaps). Does not resize on scroll. Graphic fit is pure CSS (cqw/cqh).
 */
export default function PreviewPanel({
  draft,
  playerLibrary,
  sponsors,
  clubLogoSrc,
  backgroundImage,
  activeFormat,
  onFormatChange,
}: PreviewPanelProps) {
  const active =
    GRAPHIC_FORMATS.find((format) => format.id === activeFormat) ??
    GRAPHIC_FORMATS[0]

  const sectionRef = useRef<HTMLElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  /*
    Stable panel height — resize only, never scroll.
    Fits under the header at page top; still fully visible when sticky.
  */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const update = () => {
      const header = document.querySelector("header")
      const headerH = header?.getBoundingClientRect().height ?? 0
      const height = Math.max(
        240,
        window.innerHeight - headerH - PAGE_PAD_Y_PX - BOTTOM_GAP_PX
      )
      section.style.setProperty("--preview-panel-height", `${height}px`)
    }

    update()
    window.addEventListener("resize", update)

    const header = document.querySelector("header")
    const ro =
      header && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null
    if (header && ro) ro.observe(header)

    return () => {
      window.removeEventListener("resize", update)
      ro?.disconnect()
    }
  }, [])

  async function handleExport() {
    if (isExporting) return
    setExportError(null)

    const root = document.getElementById(MATCHDAY_GRAPHIC_EXPORT_ROOT_ID)
    if (!root) {
      setExportError("Preview graphic is not ready to export yet.")
      return
    }

    setIsExporting(true)
    try {
      const filename = buildExportFilename(active, draft)
      await exportElementAsPng(root, filename)
    } catch (error) {
      console.error("PNG Export failed", error)
      setExportError(
        "Could not export PNG. Check that remote player photos load (Drive links are converted automatically), then try again."
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section
      ref={sectionRef}
      className={s.section}
      aria-labelledby="preview-heading"
      style={{ "--sticky-top": `${STICKY_TOP_PX}px` } as CSSProperties}
    >
      <div className={s.toolbar}>
        <h2 id="preview-heading" className={s.heading}>
          Preview
        </h2>
        <div
          className={s.formatTabs}
          role="tablist"
          aria-label="Graphic Format"
        >
          {GRAPHIC_FORMATS.map((format) => {
            const selected = format.id === activeFormat
            return (
              <button
                key={format.id}
                type="button"
                role="tab"
                id={`format-tab-${format.id}`}
                aria-selected={selected}
                aria-controls="format-panel"
                tabIndex={selected ? 0 : -1}
                className={selected ? s.tabActive : s.tab}
                onClick={() => onFormatChange(format.id)}
              >
                {format.label} ({format.width}×{format.height})
              </button>
            )
          })}
        </div>
      </div>

      <div
        id="format-panel"
        role="tabpanel"
        aria-labelledby={`format-tab-${active.id}`}
        className={s.panel}
      >
        <div className={s.frameMeasure}>
          <div
            className={s.scaleWrap}
            style={
              {
                "--format-w": active.width,
                "--format-h": active.height,
              } as CSSProperties
            }
          >
            <div className={s.scaleLayer}>
              <MatchdayGraphic
                draft={draft}
                playerLibrary={playerLibrary}
                sponsors={sponsors}
                clubLogoSrc={clubLogoSrc}
                backgroundImage={backgroundImage}
                format={active}
                exportRootId={MATCHDAY_GRAPHIC_EXPORT_ROOT_ID}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={s.exportStack}>
        <div className={s.exportRow}>
          <Button
            type="button"
            variant="primary"
            onClick={handleExport}
            isLoading={isExporting}
            disabled={isExporting}
          >
            {isExporting ? "Exporting…" : `Download ${active.label} PNG`}
          </Button>
          <p className={s.hint}>
            Full resolution {active.width}×{active.height}. Switch tabs to
            export the other Graphic Format.
          </p>
        </div>

        {exportError ? (
          <p className={s.exportError} role="alert">
            {exportError}
          </p>
        ) : null}
      </div>
    </section>
  )
}
