import s from "./styles.module.css"

export default function Header() {
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <div className={s.brand}>
          <h1 className={s.title}>Pittsburgh Forge — Weekly Roster Builder</h1>
          <p className={s.subtitle}>
            Fill out the roster once each week. Photos auto-populate from your
            saved player library.
          </p>
        </div>
      </div>
    </header>
  )
}
