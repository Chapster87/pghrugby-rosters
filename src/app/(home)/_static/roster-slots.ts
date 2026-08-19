export type RosterSlotGroup = "forwards" | "backs" | "finishers"

export type RosterSlotDefinition = {
  /** Jersey number on the Matchday Squad (1–23). */
  number: number
  /** Default Position label for this Roster Slot. */
  position: string
  group: RosterSlotGroup
}

/**
 * Standard rugby numbering defaults for Roster Slots.
 * Finishers (16–23) use a generic Finisher label the Operator may edit.
 */
export const ROSTER_SLOT_DEFINITIONS: RosterSlotDefinition[] = [
  { number: 1, position: "Loosehead Prop", group: "forwards" },
  { number: 2, position: "Hooker", group: "forwards" },
  { number: 3, position: "Tighthead Prop", group: "forwards" },
  { number: 4, position: "Lock", group: "forwards" },
  { number: 5, position: "Lock", group: "forwards" },
  { number: 6, position: "Blindside Flanker", group: "forwards" },
  { number: 7, position: "Openside Flanker", group: "forwards" },
  { number: 8, position: "Number 8", group: "forwards" },
  { number: 9, position: "Scrum-half", group: "backs" },
  { number: 10, position: "Fly-half", group: "backs" },
  { number: 11, position: "Left Wing", group: "backs" },
  { number: 12, position: "Inside Centre", group: "backs" },
  { number: 13, position: "Outside Centre", group: "backs" },
  { number: 14, position: "Right Wing", group: "backs" },
  { number: 15, position: "Fullback", group: "backs" },
  { number: 16, position: "Finisher", group: "finishers" },
  { number: 17, position: "Finisher", group: "finishers" },
  { number: 18, position: "Finisher", group: "finishers" },
  { number: 19, position: "Finisher", group: "finishers" },
  { number: 20, position: "Finisher", group: "finishers" },
  { number: 21, position: "Finisher", group: "finishers" },
  { number: 22, position: "Finisher", group: "finishers" },
  { number: 23, position: "Finisher", group: "finishers" },
]

export const ROSTER_SLOT_GROUPS: {
  id: RosterSlotGroup
  label: string
}[] = [
  { id: "forwards", label: "Forwards" },
  { id: "backs", label: "Backs" },
  { id: "finishers", label: "Finishers" },
]

export function getRosterSlotsByGroup(
  group: RosterSlotGroup
): RosterSlotDefinition[] {
  return ROSTER_SLOT_DEFINITIONS.filter((slot) => slot.group === group)
}
