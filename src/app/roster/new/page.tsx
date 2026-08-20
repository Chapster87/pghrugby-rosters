import type { Metadata } from "next"
import BuilderShell from "./_components/builder-shell"

import s from "./styles.module.css"

export const metadata: Metadata = {
  title: "New Roster",
}

export default function Home() {
  return (
    <div className={s.page}>
      <BuilderShell />
    </div>
  )
}
