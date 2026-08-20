import { supabase } from "@/utils/supabase"

import type { LeagueId } from "../_static/cloud-roster"

/** Player name → photo URL (Drive-converted, same flow as every image). */
export type CloudPlayerLibrary = Record<string, string>

/**
 * Cloud-shared Player Library (Supabase `player_library` table), split by
 * League — each Roster works with its League's entries. URLs are the durable
 * copy that survives browser changes; the browser-local library merges into
 * it on load. Writes are authenticated-Operator-only (RLS).
 */
export async function fetchPlayerLibrary(
  league: LeagueId
): Promise<CloudPlayerLibrary> {
  const { data, error } = await supabase
    .from("player_library")
    .select("player_name, photo_url")
    .eq("league", league)
  if (error) throw error

  const library: CloudPlayerLibrary = {}
  for (const row of (data ?? []) as {
    player_name?: string
    photo_url?: string
  }[]) {
    if (row.player_name && row.photo_url) {
      library[row.player_name] = row.photo_url
    }
  }
  return library
}

/** Insert or update by `(league, player_name)`. Empty lists are a no-op. */
export async function upsertPlayerLibraryEntries(
  league: LeagueId,
  entries: { player_name: string; photo_url: string }[]
): Promise<void> {
  if (entries.length === 0) return
  const { error } = await supabase.from("player_library").upsert(
    entries.map((entry) => ({ ...entry, league })),
    { onConflict: "league,player_name" }
  )
  if (error) throw error
}

export async function removePlayerLibraryEntry(
  league: LeagueId,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from("player_library")
    .delete()
    .eq("league", league)
    .eq("player_name", name)
  if (error) throw error
}
