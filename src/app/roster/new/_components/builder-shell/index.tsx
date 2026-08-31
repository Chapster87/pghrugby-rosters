"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import Button from "@/components/button"
import Link from "@/components/link"
import { useAuth } from "@/hooks/use-auth"

import { useBuilderState } from "../../hooks/use-builder-state"
import { insertRoster } from "../../../_helpers/cloud-roster"
import RosterEditor from "../../../_components/roster-editor"

import s from "./styles.module.css"

/**
 * Composed Matchday Squad builder shell for `/roster/new/` — the create
 * surface. Local autosave scratch until the first cloud Save, which inserts a
 * `roster_drafts` row and moves the Operator to `/roster/<uuid>/`.
 *
 * Document strip mirrors the edit surface: primary Save (and clear) live top-right.
 */
export default function BuilderShell() {
  const { user } = useAuth()
  const builder = useBuilderState(undefined, user?.id)
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleNewRoster() {
    const confirmed = window.confirm(
      "Start a new Roster? Match details and squad names will be cleared. Your logo and photo library are kept."
    )
    if (!confirmed) return
    builder.clearDraft()
  }

  async function handleSave() {
    // League is required — chosen in Match Details; Save stays disabled until set.
    const league = builder.draft.league
    if (!league || !user || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const id = await insertRoster(
        {
          league,
          draft: builder.draft,
          playerLibrary: builder.playerLibrary,
          sponsors: builder.sponsors,
          sponsorsIsCustom: builder.sponsorsIsCustom,
          clubLogo: builder.clubLogo,
          backgroundImage: builder.backgroundImage,
          backgroundIsCustom: builder.backgroundIsCustom,
          activeFormat: builder.activeFormat,
        },
        user.id
      )
      // Scratch is now cloud; leave the create surface on the saved Roster.
      builder.clearDraft()
      router.replace(`/roster/${id}/`)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save this Roster."
      )
      setSaving(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.strip}>
        <div className={s.stripLeft}>
          <Link href="/" className={s.backLink}>
            ← Rosters
          </Link>
          <span className={s.divider} aria-hidden="true" />
          <h2 className={s.rosterTitle}>New Roster</h2>
        </div>
        <div className={s.stripRight}>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleNewRoster}
          >
            New Roster
          </Button>
          {user ? (
            <Button
              type="button"
              size="small"
              onClick={handleSave}
              disabled={!builder.draft.league || saving}
              isLoading={saving}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          ) : (
            <Link
              href="/sign-in/?returnTo=/roster/new/"
              buttonStyle
              size="small"
            >
              Sign in to save
            </Link>
          )}
        </div>
      </div>

      {saveError ? (
        <p className={s.saveError} role="alert">
          {saveError}
        </p>
      ) : null}

      <RosterEditor builder={builder} />
    </div>
  )
}
