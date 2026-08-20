import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Single browser Supabase client for the whole app.
 *
 * Static export only: consumed by client components; the anon / publishable
 * key is safe to embed (NEXT_PUBLIC_* is inlined at build time). The
 * service-role key never appears here or anywhere in the client bundle.
 *
 * Session persists in localStorage (default) — no cookies/SSR — per
 * docs/research/supabase-auth-static-export.md.
 */
export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
