"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/utils/supabase"

/**
 * Subscribe to the Supabase auth session so client components can render
 * signed-in Operator vs signed-out. Browser-only: session comes from
 * localStorage, loaded on mount and kept in sync via onAuthStateChange.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadInitialSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (active) setUser(session?.user ?? null)
      } catch (error) {
        console.error("Error loading Supabase session:", error)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    loading,
    signOut: () => supabase.auth.signOut(),
  }
}
