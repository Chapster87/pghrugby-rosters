import { supabase } from "@/utils/supabase"

/**
 * Single shared app-level defaults row (`app_defaults`, id = true). Holds the
 * Background Image default applied to new Rosters — one for the whole app,
 * not split by League.
 */
export async function fetchAppDefaultBackground(): Promise<string | null> {
  const { data, error } = await supabase
    .from("app_defaults")
    .select("background_image")
    .eq("id", true)
    .maybeSingle()
  if (error) throw error

  const value = (data as { background_image?: string | null } | null)
    ?.background_image
  return typeof value === "string" && value.length > 0 ? value : null
}

/** Save the working background as the app-wide default (Operator edits). */
export async function upsertAppDefaultBackground(
  backgroundImage: string | null,
  updatedBy: string
): Promise<void> {
  const { error } = await supabase
    .from("app_defaults")
    .upsert(
      { id: true, background_image: backgroundImage, updated_by: updatedBy },
      { onConflict: "id" }
    )
  if (error) throw error
}
