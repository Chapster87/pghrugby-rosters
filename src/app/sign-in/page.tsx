import { Suspense } from "react"
import type { Metadata } from "next"
import SignInCard from "./_components/sign-in-card"
import s from "./styles.module.css"

export const metadata: Metadata = {
  title: "Sign in",
}

export default function SignInPage() {
  return (
    <div className={s.page}>
      <Suspense fallback={<div className={s.loadingPulse} aria-hidden="true" />}>
        <SignInCard />
      </Suspense>
    </div>
  )
}
