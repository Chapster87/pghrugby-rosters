"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/utils/supabase"
import { useAuth } from "@/hooks/use-auth"
import Button from "@/components/button"
import Heading from "@/components/typography/heading"
import Text from "@/components/typography/text"
import Link from "@/components/link"
import {
  clearReturnTo,
  persistReturnTo,
  readReturnTo,
} from "../../_helpers/return-to"
import s from "./style.module.css"

/**
 * Surface a Supabase OAuth failure (e.g. the user denied consent) that was
 * carried back to /sign-in/ in the URL hash, before supabase-js cleans it.
 */
function readOAuthError(): string | null {
  if (typeof window === "undefined") return null
  const hash = window.location.hash
  if (!hash) return null
  const params = new URLSearchParams(hash.slice(1))
  return params.get("error_description") || params.get("error")
}

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  )
}

export default function SignInCard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [oauthError] = useState<string | null>(readOAuthError)

  // Keep the safe destination across the OAuth round trip; query params are
  // dropped by the redirect, but sessionStorage survives it.
  useEffect(() => {
    persistReturnTo(searchParams.get("returnTo"))
  }, [searchParams])

  // Once a session exists (fresh sign-in, or arriving already signed in),
  // bounce to the requested destination.
  useEffect(() => {
    if (loading || !user) return
    const target = readReturnTo()
    clearReturnTo()
    router.replace(target)
  }, [user, loading, router])

  async function handleGoogleSignIn() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/sign-in/`,
      },
    })
    if (error) setError(error.message)
  }

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }
    // Session established — the redirect effect above navigates to returnTo.
  }

  if (loading) {
    return <div className={s.loadingPulse} aria-hidden="true" />
  }

  return (
    <section className={s.card} aria-labelledby="sign-in-title">
      <Heading level="h1" display="h2" id="sign-in-title">
        Sign in
      </Heading>
      <Text size="sm" className={s.intro}>
        Invited Operators sign in to create and edit Rosters.
      </Text>

      {(error || oauthError) && (
        <p className={s.error} role="alert">
          {error || oauthError}
        </p>
      )}

      <Button
        type="button"
        variant="secondary"
        onClick={handleGoogleSignIn}
        className={s.googleButton}
        beforeText={<GoogleMark />}
      >
        Continue with Google
      </Button>

      <div className={s.divider}>
        <span>or</span>
      </div>

      <form className={s.form} onSubmit={handleEmailSignIn}>
        <label className={s.field}>
          <span className={s.label}>Email</span>
          <input
            className={s.input}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>Password</span>
          <input
            className={s.input}
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <Button type="submit" isLoading={submitting}>
          Sign in
        </Button>
      </form>

      <p className={s.note}>Invited Operators only — no public sign-up.</p>

      <Link href="/" className={s.back}>
        ← Back to Rosters
      </Link>
    </section>
  )
}
