"use client"

import type {
  Draft,
  PlayerLibrary,
  RosterSlotValue,
} from "../../_static/builder-types"
import {
  ROSTER_SLOT_GROUPS,
  getRosterSlotsByGroup,
} from "../../_static/roster-slots"

import s from "./styles.module.css"

type RosterSlotsPanelProps = {
  draft: Draft
  playerLibrary: PlayerLibrary
  onSlotChange: (number: number, patch: Partial<RosterSlotValue>) => void
}

/**
 * Roster Slot editors grouped by forwards / backs / finishers.
 * Full slot rows land in the controls-parity ticket.
 */
export default function RosterSlotsPanel({
  draft,
  playerLibrary: _playerLibrary,
  onSlotChange: _onSlotChange,
}: RosterSlotsPanelProps) {
  return (
    <section className={s.section} aria-label="Roster Slots">
      {ROSTER_SLOT_GROUPS.map((group) => {
        const slots = getRosterSlotsByGroup(group.id)
        const filled = slots.filter((slot) =>
          draft.slots[slot.number]?.name?.trim()
        ).length

        return (
          <div key={group.id} className={s.group}>
            <h2 className={s.heading}>
              Roster — {group.label}
              <span className={s.count}>
                {filled}/{slots.length}
              </span>
            </h2>
            <ul className={s.slotList}>
              {slots.map((slot) => {
                const value = draft.slots[slot.number]
                return (
                  <li key={slot.number} className={s.slotItem}>
                    <span className={s.jersey}>{slot.number}</span>
                    <span className={s.position}>
                      {value?.position || slot.position}
                    </span>
                    <span className={s.name}>{value?.name?.trim() || "—"}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
