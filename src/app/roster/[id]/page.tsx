import type { Metadata } from "next"
import RosterShell from "./_components/roster-shell"

export const metadata: Metadata = {
  title: "Roster",
}

/**
 * Open surface for `/roster/<uuid>/` share links.
 *
 * Statically exported as a single template (the nil UUID sentinel); DreamHost
 * rewrites every unknown UUID path onto it (see public/.htaccess). The
 * client shell reads the real id from the live URL, so no build-time
 * enumeration of Roster ids is needed. The static `new` route wins over this
 * segment, keeping `/roster/new/` the create surface.
 */
export function generateStaticParams() {
  return [{ id: "00000000-0000-0000-0000-000000000000" }]
}

export default function RosterPage() {
  return <RosterShell />
}
