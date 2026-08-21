import Image from "next/image"
import Link from "@components/link"

import s from "./styles.module.css"
import AuthStatus from "./_components/auth-status"

const CREST_SRC = "/images/pittsburgh-forge-crest.png"

/** Product chrome for the Matchday Squad builder. */
export default function Header() {
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <div className={s.brand}>
          <Link href="/">
            <Image
              className={s.crest}
              src={CREST_SRC}
              alt=""
              width={40}
              height={40}
            />
          </Link>
          <div className={s.brandText}>
            <h1 className={s.title}>Pittsburgh Forge — Roster Builder</h1>
            <p className={s.subtitle}>
              Build matchday squad graphics for social — Portrait and Story PNG
              export.
            </p>
          </div>
        </div>
        <AuthStatus />
      </div>
    </header>
  )
}
