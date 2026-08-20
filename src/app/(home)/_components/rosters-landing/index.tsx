"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/utils/supabase"
import { useAuth } from "@/hooks/use-auth"
import Button from "@/components/button"
import Link from "@/components/link"
import Heading from "@/components/typography/heading"
import Text from "@/components/typography/text"

import {
  LEAGUE_LABEL,
  MATCH_TYPE_LABEL,
  type LeagueId,
  type RosterRow,
} from "../../_static/rosters"
import {
  formatMatchDate,
  formatUpdated,
  opponentPhrase,
} from "../../_helpers/rosters"

import s from "./style.module.css"

type Filter = "all" | LeagueId

const CREST_SRC = "/images/pittsburgh-forge-crest.png"

/**
 * Auth-gated landing (prototype Variant C): a single chronological dense
 * table of cloud Rosters, filtered by League chips. Signed-out visitors get
 * a simple identity + sign-in gate; the table lists `roster_drafts` via the
 * authenticated SELECT policy.
 */
export default function RostersLanding() {
  const { user, loading } = useAuth()

  const [filter, setFilter] = useState<Filter>("all")
  const [rows, setRows] = useState<RosterRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!user) return
    let active = true

    supabase
      .from("roster_drafts")
      .select(
        "id, title, league, division, match_type, opponent, match_date, updated_at, state"
      )
      .order("match_date", { ascending: false, nullsFirst: false })
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) {
          setError(fetchError.message)
          setRows([])
          return
        }
        setError(null)
        setRows((data ?? []) as RosterRow[])
      })

    return () => {
      active = false
    }
  }, [user, reload])

  const visibleRows = useMemo(() => {
    const base = rows ?? []
    if (filter === "all") return base
    return base.filter((r) => r.league === filter)
  }, [rows, filter])

  const counts = useMemo(() => {
    const base = rows ?? []
    return {
      all: base.length,
      mens: base.filter((r) => r.league === "mens").length,
      womens: base.filter((r) => r.league === "womens").length,
    }
  }, [rows])

  if (loading) {
    return <div className={s.loadingPulse} aria-hidden="true" />
  }

  if (!user) {
    return <SignedOutGate />
  }

  return (
    <div className={s.page}>
      <header className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <Heading level="h2" className={s.pageTitle}>
            Rosters
          </Heading>
          <div className={s.chips} role="group" aria-label="Filter by League">
            <Chip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label={`All (${counts.all})`}
            />
            <Chip
              active={filter === "mens"}
              onClick={() => setFilter("mens")}
              label={`Men's (${counts.mens})`}
            />
            <Chip
              active={filter === "womens"}
              onClick={() => setFilter("womens")}
              label={`Women's (${counts.womens})`}
            />
          </div>
        </div>
        <Link href="/roster/new/" buttonStyle>
          New Roster
        </Link>
      </header>

      <div className={s.panel}>
        {error ? (
          <div className={s.state} role="alert">
            <p className={s.stateTitle}>Couldn&apos;t load Rosters</p>
            <p className={s.stateBody}>{error}</p>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => setReload((n) => n + 1)}
            >
              Try again
            </Button>
          </div>
        ) : rows === null ? (
          <div className={s.state} aria-hidden="true">
            <div className={s.loadingRows} />
            <div className={s.loadingRows} />
            <div className={s.loadingRows} />
          </div>
        ) : visibleRows.length === 0 ? (
          <Empty filter={filter} />
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Opponent</th>
                  <th scope="col">Match date</th>
                  <th scope="col">League</th>
                  <th scope="col">Type</th>
                  <th scope="col">Edited</th>
                  <th scope="col">
                    <span className={s.srOnly}>Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((roster) => (
                  <tr key={roster.id}>
                    <td className={s.titleCell}>
                      <Link
                        href={`/roster/${roster.id}/`}
                        className={s.titleLink}
                      >
                        {roster.title}
                      </Link>
                    </td>
                    <td>{opponentPhrase(roster)}</td>
                    <td>
                      <time dateTime={roster.match_date ?? undefined}>
                        {formatMatchDate(roster.match_date)}
                      </time>
                    </td>
                    <td>
                      <span className={s.badge} data-league={roster.league}>
                        {LEAGUE_LABEL[roster.league]}
                      </span>
                    </td>
                    <td>{MATCH_TYPE_LABEL[roster.match_type]}</td>
                    <td className={s.muted}>
                      {formatUpdated(roster.updated_at)}
                    </td>
                    <td className={s.actionCell}>
                      <Link
                        href={`/roster/${roster.id}/`}
                        className={s.rowAction}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={active ? s.chipActive : s.chip}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function Empty({ filter }: { filter: Filter }) {
  const label = filter === "all" ? "Rosters" : `${LEAGUE_LABEL[filter]} Rosters`

  return (
    <div className={s.state}>
      <p className={s.stateTitle}>No {label} to show</p>
      <p className={s.stateBody}>
        Save a Roster and it will appear in this list.
      </p>
      <Link href="/roster/new/" buttonStyle>
        New Roster
      </Link>
    </div>
  )
}

function SignedOutGate() {
  return (
    <div className={s.gate}>
      <img
        className={s.crest}
        src={CREST_SRC}
        alt=""
        width={56}
        height={56}
        draggable={false}
      />
      <Heading level="h2" className={s.gateTitle}>
        Sign in to manage Rosters
      </Heading>
      <Text size="sm" className={s.gateBody}>
        Matchday Squad Rosters are created, edited, and saved by invited
        Pittsburgh Forge Operators.
      </Text>
      <Link href="/sign-in/?returnTo=/" buttonStyle>
        Sign in
      </Link>
      <p className={s.gateNote}>Invited Operators only — no public sign-up.</p>
    </div>
  )
}
