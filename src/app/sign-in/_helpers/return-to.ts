/**
 * Safe same-origin `returnTo` handling for the sign-in flow.
 *
 * sessionStorage carries the destination across the Google OAuth round trip:
 * Supabase drops the original query string when it redirects back to
 * `/sign-in/` with the session in the URL hash, but same-tab sessionStorage
 * survives, so we can still land the Operator where they started.
 */

const RETURN_TO_KEY = "pghrugby.signInReturnTo"

/**
 * Coerce an arbitrary `returnTo` value into a safe same-origin path.
 *
 * Only a single-slash relative path is accepted; anything that could escape
 * the origin (protocol-relative `//host`, a scheme like `javascript:`,
 * backslash tricks) or loop back onto sign-in falls back to `/`.
 */
export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value) return "/"

  let decoded: string
  try {
    decoded = decodeURIComponent(value)
  } catch {
    return "/"
  }

  const trimmed = decoded.trim()
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/"
  if (trimmed.includes("\\") || trimmed.includes(":")) return "/"
  if (trimmed === "/sign-in" || trimmed === "/sign-in/") return "/"

  return trimmed
}

/** Read the persisted destination, defaulting to `/` when absent. */
export function readReturnTo(): string {
  try {
    return sanitizeReturnTo(window.sessionStorage.getItem(RETURN_TO_KEY))
  } catch {
    return "/"
  }
}

/** Persist the requested destination (if it is a real path) for the OAuth round trip. */
export function persistReturnTo(value: string | null | undefined): void {
  const safe = sanitizeReturnTo(value)
  if (safe === "/") return
  try {
    window.sessionStorage.setItem(RETURN_TO_KEY, safe)
  } catch {
    // storage unavailable (private browsing) — the default `/` still applies
  }
}

/** Forget the destination once we have navigated to it. */
export function clearReturnTo(): void {
  try {
    window.sessionStorage.removeItem(RETURN_TO_KEY)
  } catch {
    // ignore
  }
}
