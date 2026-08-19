"use client"

import { useEffect, useRef, useState } from "react"

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

type PreviewPanelProps = {
  draft: Draft
  playerLibrary: PlayerLibrary
  sponsors: Sponsors
  clubLogoSrc: string
  activeFormat: GraphicFormatId
  onFormatChange: (format: GraphicFormatId) => void
}

/** Fallback before the column width is measured. */
const PREVIEW_WIDTH_FALLBACK = 520

/**
 * Live Matchday Squad preview for Portrait + Story.
 * Scale lives on a wrapper only — the graphic root stays export-friendly.
 * On-screen size tracks the right-column width so the preview fills available space.
 */
export default function PreviewPanel({
  draft,
  playerLibrary,
  sponsors,
  clubLogoSrc,
  activeFormat,
  onFormatChange,
}: PreviewPanelProps) {
  const active =
    GRAPHIC_FORMATS.find((format) => format.id === activeFormat) ??
    GRAPHIC_FORMATS[0]

  const frameRef = useRef<HTMLDivElement>(null)
  const [frameWidth, setFrameWidth] = useState(PREVIEW_WIDTH_FALLBACK)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return

    const update = (width: number) => {
      if (width > 0) setFrameWidth(width)
    }

    update(el.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      update(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scale = frameWidth / active.width
  const displayWidth = Math.round(active.width * scale)
  const displayHeight = Math.round(active.height * scale)

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
    <section className={s.section} aria-labelledby="preview-heading">
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
                {format.label}
                <span className={s.tabSize}>
                  {format.width}×{format.height}
                </span>
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
        {/* Width probe: full column; height comes from scaled native aspect */}
        <div ref={frameRef} className={s.frameMeasure}>
          <div
            className={s.scaleWrap}
            style={{ width: displayWidth, height: displayHeight }}
          >
            {/*
              Scale is applied only to this layer. MatchdayGraphic stays at
              native pixels with no transform — Export can capture its root.
            */}
            <div
              className={s.scaleLayer}
              style={{
                width: active.width,
                height: active.height,
                transform: `scale(${scale})`,
              }}
            >
              <MatchdayGraphic
                draft={draft}
                playerLibrary={playerLibrary}
                sponsors={sponsors}
                clubLogoSrc={clubLogoSrc}
                format={active}
                exportRootId={MATCHDAY_GRAPHIC_EXPORT_ROOT_ID}
              />
            </div>
          </div>
        </div>
      </div>

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
          Full resolution {active.width}×{active.height}. Switch tabs to export
          the other Graphic Format.
        </p>
      </div>

      {exportError ? (
        <p className={s.exportError} role="alert">
          {exportError}
        </p>
      ) : null}
    </section>
  )
}
