import BuilderShell from "./_components/builder-shell"

import s from "./styles.module.css"

export default function Home() {
  return (
    <div className={s.page}>
      <BuilderShell />
    </div>
  )
}
