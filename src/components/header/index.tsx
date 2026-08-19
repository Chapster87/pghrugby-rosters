import s from "./styles.module.css"

const CREST_SRC = "/images/pittsburgh-forge-crest.png"

/** Product chrome for the Matchday Squad builder. */
export default function Header() {
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <div className={s.brand}>
          <img
            className={s.crest}
            src={CREST_SRC}
            alt=""
            width={40}
            height={40}
            draggable={false}
          />
          <div className={s.brandText}>
            <h1 className={s.title}>
              Pittsburgh Forge — Weekly Roster Builder
            </h1>
            <p className={s.subtitle}>
              Build matchday squad graphics for social — Portrait and Story PNG
              export.
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
