import type { Metadata } from "next"
import RostersLanding from "./_components/rosters-landing"

export const metadata: Metadata = {
  title: "Rosters",
}

/**
 * `/` — auth-gated Rosters landing. Signed-in Operators get the dense
 * chronological table (Variant C); signed-out visitors get a sign-in gate.
 */
export default function Home() {
  return <RostersLanding />
}
