import { supabase } from "@/utils/supabase"

import type { LeagueId } from "../_static/cloud-roster"
import { SPONSOR_SLOT_COUNT } from "../new/_static/builder-types"

/** Six sponsor URL slots, normalized from a stored jsonb array. */
function normalizeSponsors(raw: unknown): string[] {
  const array = Array.isArray(raw) ? raw : []
  return Array.from({ length: SPONSOR_SLOT_COUNT }, (_, i) =>
    typeof array[i] === "string" ? array[i] : ""
  )
}

/** Current league-default sponsors (empty strings when none saved yet). */
export async function fetchLeagueDefaults(
  league: LeagueId
): Promise<string[]> {
  const { data, error } = await supabase
    .from("league_defaults")
    .select("sponsors")
    .eq("league", league)
    .maybeSingle()
  if (error) throw error
  return normalizeSponsors((data as { sponsors?: unknown } | null)?.sponsors)
}

/** Save the working sponsor set as the league defaults (Operator edits). */
export async function upsertLeagueDefaults(
  league: LeagueId,
  sponsors: string[],
  updatedBy: string
): Promise<void> {
  const { error } = await supabase
    .from("league_defaults")
    .upsert({ league, sponsors, updated_by: updatedBy }, { onConflict: "league" })
  if (error) throw error
}
