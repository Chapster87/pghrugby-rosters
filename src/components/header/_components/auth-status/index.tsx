"use client"

import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import Avatar from "@/components/avatar"
import Link from "@/components/link"
import s from "./style.module.css"

/**
 * Signed-in Operator avatar in the upper right of the header with a sign-out
 * action; signed-out visitors get a Sign In link to the /sign-in/ route that
 * returns them to the current surface after auth.
 */
export default function AuthStatus() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <div className={s.loadingPulse} aria-hidden="true" />
  }

  if (!user) {
    return (
      <Link
        href={`/sign-in/?returnTo=${encodeURIComponent(pathname)}`}
        buttonStyle
        variant="secondary"
        size="small"
      >
        Sign In
      </Link>
    )
  }

  return (
    <div className={s.container}>
      <Avatar
        src={user.user_metadata.avatar_url}
        alt={user.email ?? "Operator"}
        fallback={
          user.user_metadata.full_name ||
          user.user_metadata.name ||
          user.email ||
          "?"
        }
        size={32}
        bordered
      />
      <button type="button" className={s.signOut} onClick={signOut}>
        Sign out
      </button>
    </div>
  )
}
