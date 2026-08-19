"use client"

import { useId, useMemo } from "react"

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
 * Name fields autocomplete from the Player Library; photo thumb fills on name match.
 * Finishers stay editable here even when unnamed (graphic omits empty finishers later).
 */
export default function RosterSlotsPanel({
  draft,
  playerLibrary,
  onSlotChange,
}: RosterSlotsPanelProps) {
  const listId = useId()
  const libraryNames = useMemo(
    () => Object.keys(playerLibrary).sort((a, b) => a.localeCompare(b)),
    [playerLibrary]
  )

  return (
    <section className={s.section} aria-label="Roster Slots">
      <datalist id={listId}>
        {libraryNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

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
                const value = draft.slots[slot.number] ?? {
                  name: "",
                  position: slot.position,
                }
                const trimmedName = value.name.trim()
                const photoUrl =
                  trimmedName && playerLibrary[trimmedName]
                    ? playerLibrary[trimmedName]
                    : null

                return (
                  <li key={slot.number} className={s.slotItem}>
                    <span className={s.jersey} aria-hidden="true">
                      {slot.number}
                    </span>
                    <label className={s.srOnly} htmlFor={`pos-${slot.number}`}>
                      Position for jersey {slot.number}
                    </label>
                    <input
                      id={`pos-${slot.number}`}
                      type="text"
                      className={s.posInput}
                      value={value.position}
                      placeholder={slot.position}
                      onChange={(event) =>
                        onSlotChange(slot.number, {
                          position: event.target.value,
                        })
                      }
                    />
                    <label className={s.srOnly} htmlFor={`name-${slot.number}`}>
                      Player name for jersey {slot.number}
                    </label>
                    <input
                      id={`name-${slot.number}`}
                      type="text"
                      className={s.nameInput}
                      list={listId}
                      value={value.name}
                      placeholder="Player name"
                      autoComplete="off"
                      onChange={(event) =>
                        onSlotChange(slot.number, {
                          name: event.target.value,
                        })
                      }
                    />
                    {photoUrl ? (
                      <img src={photoUrl} alt="" className={s.thumb} />
                    ) : (
                      <span className={s.thumbPlaceholder} aria-hidden="true" />
                    )}
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
