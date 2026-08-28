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
 */
export default function BuilderShell() {
  const { user } = useAuth()
  const builder = useBuilderState(undefined, user?.id)
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleClearDraft() {
    const confirmed = window.confirm(
      "Clear all names and match details for a new week? Your logo and photo library are kept."
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
    <RosterEditor
      builder={builder}
      actions={
        <>
          {user ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={!builder.draft.league || saving}
              isLoading={saving}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          ) : (
            <Link href="/sign-in/?returnTo=/roster/new/" buttonStyle>
              Sign in to save
            </Link>
          )}

          <Button variant="secondary" type="button" onClick={handleClearDraft}>
            New Week (clear roster)
          </Button>

          {saveError ? (
            <p className={s.saveError} role="alert">
              {saveError}
            </p>
          ) : null}
        </>
      }
    />
  )
}
