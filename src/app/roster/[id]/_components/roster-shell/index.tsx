"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import Button from "@/components/button"
import ContextMenu from "@/components/context-menu"
import Link from "@/components/link"
import SvgIcon from "@/components/svg-icon"
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
  duplicateRoster,
  fetchRoster,
  isDuplicateCopyTitle,
  updateRoster,
} from "../../../_helpers/cloud-roster"
import type { CloudRosterRow } from "../../../_static/cloud-roster"
import type { Venue } from "../../../new/_static/builder-types"
import RosterEditor from "../../../_components/roster-editor"
import RosterViewer from "../../../_components/roster-viewer"
import ShareButton from "../../../_components/share-button"

import s from "./style.module.css"

/**
 * Matches Postgres `uuid` values by shape (any version). The nil-UUID
 * sentinel that Apache rewrites onto must pass too, so the prerendered
 * template shows the loading state rather than a not-found flash.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Full editor surface for signed-in Operators.
 * Supports live editing across Mk.2 tabs, saving, duplicating, and deleting.
 */
function OperatorView({
  row,
  userId,
  onRowUpdated,
}: {
  row: CloudRosterRow
  userId: string
  onRowUpdated: (updated: CloudRosterRow) => void
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<"duplicate" | "delete" | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const seed: BuilderSeed = useMemo(() => {
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

  const builder = useBuilderState(seed, userId)

  const displayTitle = useMemo(() => {
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
    if (saving) return
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
        playerLibrary: builder.playerLibrary,
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
        onRowUpdated({ ...row, title_is_custom: false })
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save this Roster."
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDuplicate() {
    if (busy) return
    setBusy("duplicate")
    setSaveError(null)
    try {
      const newId = await duplicateRoster(row.id, userId)
      router.push(`/roster/${newId}/`)
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not duplicate this Roster."
      )
      setBusy(null)
    }
  }

  async function handleDelete() {
    if (busy) return
    const confirmed = window.confirm(
      "Delete this Roster permanently? This can't be undone."
    )
    if (!confirmed) return
    setBusy("delete")
    setSaveError(null)
    try {
      await deleteRoster(row.id)
      router.replace("/")
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not delete this Roster."
      )
      setBusy(null)
    }
  }

  const menuBusy = busy !== null

  return (
    <>
      <div className={s.strip}>
        <div className={s.stripLeft}>
          <Link href="/" className={s.backLink}>
            ← Rosters
          </Link>
          <span className={s.divider} aria-hidden="true" />
          <h2 className={s.rosterTitle}>{displayTitle}</h2>
        </div>
        <div className={s.stripRight}>
          <ShareButton rosterId={row.id} />
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
            disabled={saving || menuBusy}
            isLoading={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
          <ContextMenu>
            <ContextMenu.Trigger>
              <button
                type="button"
                className={s.menuButton}
                aria-label="Roster actions"
                disabled={menuBusy}
              >
                <SvgIcon icon="more-vertical" size={16} />
              </button>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
              <ContextMenu.Item
                onSelect={() => {
                  void handleDuplicate()
                }}
                icon={<SvgIcon icon="copy" size={14} />}
                disabled={menuBusy}
              >
                {busy === "duplicate" ? "Duplicating…" : "Duplicate"}
              </ContextMenu.Item>
              <ContextMenu.Separator />
              <ContextMenu.Item
                onSelect={() => {
                  void handleDelete()
                }}
                variant="danger"
                icon={<SvgIcon icon="trash-2" size={14} />}
                disabled={menuBusy}
              >
                {busy === "delete" ? "Deleting…" : "Delete"}
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu>
        </div>
      </div>

      {saveError ? (
        <p className={s.saveError} role="alert">
          {saveError}
        </p>
      ) : null}

      <RosterEditor builder={builder} />
    </>
  )
}

/**
 * Read-only surface for Reviewers (unauthenticated visitors).
 * Shows the document title, share button, and "Sign in to edit" link in the strip,
 * followed by the preview-first RosterViewer.
 */
function ReviewerView({ row }: { row: CloudRosterRow }) {
  const displayTitle = useMemo(() => {
    if (row.title_is_custom) return row.title
    return buildAutoTitle({
      league: row.league,
      division: row.division,
      opponent: row.opponent ?? "",
      venue: (row.state?.match?.venue as Venue) || "Home",
      matchDate: row.match_date ?? "",
    })
  }, [row])

  return (
    <>
      <div className={s.strip}>
        <div className={s.stripLeft}>
          <Link href="/" className={s.backLink}>
            ← Rosters
          </Link>
          <span className={s.divider} aria-hidden="true" />
          <h2 className={s.rosterTitle}>{displayTitle}</h2>
        </div>
        <div className={s.stripRight}>
          <ShareButton rosterId={row.id} />
          <Link
            href={`/sign-in/?returnTo=${encodeURIComponent(`/roster/${row.id}/`)}`}
            buttonStyle
            size="small"
          >
            Sign in to edit
          </Link>
        </div>
      </div>

      <RosterViewer row={row} />
    </>
  )
}

/**
 * Dual-mode surface for `/roster/<uuid>/`. The id comes from the live path
 * (Apache rewrites unknown UUID URLs onto the exported template).
 *
 * - Signed-in Operators get the full Mk.2 editor chrome with Save/Duplicate/Delete.
 * - Reviewers (unauthenticated) see a read-only preview-first graphic, format toggle,
 *   PNG export, and Match Details summary with no edit controls.
 */
export default function RosterShell() {
  const pathname = usePathname()
  const id = pathname.split("/").filter(Boolean).pop() ?? ""
  const valid = UUID_PATTERN.test(id)

  const { user, loading: authLoading } = useAuth()

  const [status, setStatus] = useState<"loading" | "found" | "missing">(
    "loading"
  )
  const [row, setRow] = useState<CloudRosterRow | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

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

  const notFound = !valid || status === "missing"

  return (
    <div className={s.page}>
      {status === "loading" || (status === "found" && authLoading) ? (
        <div className={s.panel} role="status" aria-busy="true">
          <div className={s.loadingPulse} aria-hidden="true" />
          <p className={s.stateBody}>Loading roster…</p>
        </div>
      ) : notFound || !row ? (
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
      ) : user ? (
        <OperatorView
          row={row}
          userId={user.id}
          onRowUpdated={(updated) => setRow(updated)}
        />
      ) : (
        <ReviewerView row={row} />
      )}
    </div>
  )
}
