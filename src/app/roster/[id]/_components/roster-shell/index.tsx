"use client"

import { usePathname } from "next/navigation"
import Button from "@/components/button"
import Link from "@/components/link"

import s from "./style.module.css"

/**
 * Matches Postgres `uuid` values by shape (any version). The nil-UUID
 * sentinel that Apache rewrites onto must pass too, so the prerendered
 * template shows the loading state rather than a not-found flash.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Minimal shell for `/roster/<uuid>/` open surfaces. The id comes from the
 * live path (Apache rewrites unknown UUID URLs onto the exported template),
 * never from build-time params. Editor vs Reviewer chrome, cloud loading,
 * and Save wiring land in their own tickets.
 */
export default function RosterShell() {
  const pathname = usePathname()
  const id = pathname.split("/").filter(Boolean).pop() ?? ""
  const valid = UUID_PATTERN.test(id)

  return (
    <div className={s.page}>
      <div className={s.strip}>
        <div className={s.stripLeft}>
          <Link href="/" className={s.backLink}>
            ← Rosters
          </Link>
          <span className={s.divider} aria-hidden="true" />
          <h2 className={s.rosterTitle}>Roster</h2>
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
          <Button type="button" size="small" disabled>
            Save
          </Button>
        </div>
      </div>

      {valid ? (
        <div className={s.panel} role="status" aria-busy="true">
          <div className={s.loadingPulse} aria-hidden="true" />
          <p className={s.stateBody}>Loading roster…</p>
        </div>
      ) : (
        <div className={s.panel}>
          <p className={s.stateTitle}>Roster not found</p>
          <p className={s.stateBody}>
            This link isn&apos;t a Roster URL. Check the address or head back to
            your Rosters list.
          </p>
          <Link href="/" buttonStyle>
            Back to Rosters
          </Link>
        </div>
      )}
    </div>
  )
}
