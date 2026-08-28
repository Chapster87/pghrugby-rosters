"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import Button from "@/components/button"
import Link from "@/components/link"
import { useAuth } from "@/hooks/use-auth"

import {
  useBuilderState,
  type BuilderSeed,
} from "../../../new/hooks/use-builder-state"
import { loadClubLogo, loadSponsors } from "../../../new/_helpers/storage"
import {
  buildAutoTitle,
  deleteRoster,
  deserializeRoster,
  fetchRoster,
  isDuplicateCopyTitle,
  updateRoster,
} from "../../../_helpers/cloud-roster"
import type { CloudRosterRow } from "../../../_static/cloud-roster"
import RosterEditor from "../../../_components/roster-editor"

import s from "./style.module.css"

/**
 * Matches Postgres `uuid` values by shape (any version). The nil-UUID
 * sentinel that Apache rewrites onto must pass too, so the prerendered
 * template shows the loading state rather than a not-found flash.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Edit surface for `/roster/<uuid>/`. The id comes from the live path (Apache
 * rewrites unknown UUID URLs onto the exported template), never from
 * build-time params. Loads the cloud row, edits via the shared Mk.1 editor,
 * Save updates the row, Delete hard-deletes with a confirm. Signed-out
 * visitors get a sign-in gate — the full Reviewer read-only mode is its own
 * ticket (Dual-mode Operator vs Reviewer).
 */
export default function RosterShell() {
  const pathname = usePathname()
  const id = pathname.split("/").filter(Boolean).pop() ?? ""
  const valid = UUID_PATTERN.test(id)

  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [status, setStatus] = useState<"loading" | "found" | "missing">(
    "loading"
  )
  const [row, setRow] = useState<CloudRosterRow | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!valid) return
    let active = true
    fetchRoster(id)
      .then((fetched) => {
        if (!active) return
        if (fetched) {
          setRow(fetched)
          setStatus("found")
        } else {
          setStatus("missing")
        }
      })
      .catch((error: unknown) => {
        if (!active) return
        setLoadError(
          error instanceof Error ? error.message : "Could not load this Roster."
        )
        setStatus("missing")
      })
    return () => {
      active = false
    }
  }, [id, valid])

  const seed: BuilderSeed | null = useMemo(() => {
    if (!row) return null
    const base = deserializeRoster(row)
    return {
      ...base,
      // Uploaded images are data URLs, which never round-trip (cloud contract):
      // fall back to the browser-local working set so the preview keeps what
      // the Operator uploaded this week. Drive-converted URLs do round-trip.
      sponsors: base.sponsors.some(Boolean) ? base.sponsors : loadSponsors(),
      clubLogo: base.clubLogo ?? loadClubLogo(),
    }
  }, [row])

  const builder = useBuilderState(seed, user?.id)

  const displayTitle = useMemo(() => {
    if (!row) return "Roster"
    if (row.title_is_custom) return row.title
    return buildAutoTitle({
      // Draft league/division can lag one render behind the seed; the row
      // columns are always set, so prefer draft and fall back to them.
      league: builder.draft.league || row.league,
      division: builder.draft.division || row.division,
      opponent: builder.draft.opponent,
      venue: builder.draft.venue,
      matchDate: builder.draft.matchDate,
    })
  }, [row, builder.draft])

  async function handleSave() {
    if (!row || !user || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      // Duplicates pin "Copy of …" until Save — then drop custom and resume auto-title.
      const clearingCopyTitle =
        row.title_is_custom && isDuplicateCopyTitle(row.title)
      const titleIsCustom = row.title_is_custom && !clearingCopyTitle
      await updateRoster(row.id, {
        // League lives in Match Details; fall back to the row column while the
        // editor is still seeding so Save never writes an empty league.
        league: builder.draft.league || row.league,
        draft: builder.draft,
        sponsors: builder.sponsors,
        sponsorsIsCustom: builder.sponsorsIsCustom,
        clubLogo: builder.clubLogo,
        backgroundImage: builder.backgroundImage,
        backgroundIsCustom: builder.backgroundIsCustom,
        activeFormat: builder.activeFormat,
        titleIsCustom,
        title: titleIsCustom ? row.title : undefined,
      })
      if (clearingCopyTitle) {
        setRow((prev) => (prev ? { ...prev, title_is_custom: false } : prev))
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save this Roster."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!row || deleting) return
    const confirmed = window.confirm(
      "Delete this Roster permanently? This can't be undone."
    )
    if (!confirmed) return
    setDeleting(true)
    setSaveError(null)
    try {
      await deleteRoster(row.id)
      router.replace("/")
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not delete this Roster."
      )
      setDeleting(false)
    }
  }

  const notFound = !valid || status === "missing"

  return (
    <div className={s.page}>
      <div className={s.strip}>
        <div className={s.stripLeft}>
          <Link href="/" className={s.backLink}>
            ← Rosters
          </Link>
          <span className={s.divider} aria-hidden="true" />
          <h2 className={s.rosterTitle}>{displayTitle}</h2>
        </div>
        <div className={s.stripRight}>
          <Link
            href="/roster/new/"
            buttonStyle
            variant="secondary"
            size="small"
          >
            New Roster
          </Link>
          <Button
            type="button"
            size="small"
            onClick={handleSave}
            disabled={!user || !row || saving}
            isLoading={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {status === "loading" || (status === "found" && authLoading) ? (
        <div className={s.panel} role="status" aria-busy="true">
          <div className={s.loadingPulse} aria-hidden="true" />
          <p className={s.stateBody}>Loading roster…</p>
        </div>
      ) : notFound ? (
        <div className={s.panel}>
          <p className={s.stateTitle}>
            {loadError ? "Couldn&apos;t load this Roster" : "Roster not found"}
          </p>
          <p className={s.stateBody}>
            {loadError ??
              "This link isn&apos;t a Roster URL. Check the address or head back to your Rosters list."}
          </p>
          <Link href="/" buttonStyle>
            Back to Rosters
          </Link>
        </div>
      ) : !user ? (
        <div className={s.panel}>
          <p className={s.stateTitle}>{displayTitle}</p>
          <p className={s.stateBody}>
            Sign in to edit this Roster. Reviewers see a read-only preview.
          </p>
          <Link
            href={`/sign-in/?returnTo=${encodeURIComponent(`/roster/${id}/`)}`}
            buttonStyle
          >
            Sign in to edit
          </Link>
        </div>
      ) : (
        <RosterEditor
          builder={builder}
          actions={
            <>
              <button
                type="button"
                className={s.deleteButton}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete Roster"}
              </button>
              {saveError ? (
                <p className={s.saveError} role="alert">
                  {saveError}
                </p>
              ) : null}
            </>
          }
        />
      )}
    </div>
  )
}
