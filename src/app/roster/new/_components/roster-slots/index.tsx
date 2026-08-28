"use client"

import { useMemo } from "react"
import Image from "next/image"

import type {
  Draft,
  PlayerLibrary,
  RosterSlotValue,
} from "../../_static/builder-types"
import {
  ROSTER_SLOT_GROUPS,
  getRosterSlotsByGroup,
} from "../../_static/roster-slots"
import { resolveSlotPhotoSrc } from "../../_helpers/resolve-slot-photo"
import PlayerNameCombobox from "../player-name-combobox"

import s from "./styles.module.css"

type RosterSlotsPanelProps = {
  draft: Draft
  playerLibrary: PlayerLibrary
  onSlotChange: (number: number, patch: Partial<RosterSlotValue>) => void
}

/**
 * Roster Slot editors grouped by forwards / backs / finishers.
 * Name fields use a Radix combobox fed by the Player Library; photo thumb
 * fills on exact name match.
 * Finishers stay editable here even when unnamed (graphic omits empty finishers later).
 */
export default function RosterSlotsPanel({
  draft,
  playerLibrary,
  onSlotChange,
}: RosterSlotsPanelProps) {
  // Names already placed in any Roster Slot — the combobox hides them from
  // every dropdown so each library player can only be picked once per Roster.
  // Lowercased so a free-typed "john smith" also hides the "John Smith" pick.
  const usedNames = useMemo(() => {
    const set = new Set<string>()
    for (const slot of Object.values(draft.slots)) {
      const name = slot.name.trim().toLowerCase()
      if (name) set.add(name)
    }
    return set
  }, [draft.slots])

  return (
    <section className={s.section} aria-label="Roster Slots">
      {ROSTER_SLOT_GROUPS.map((group) => {
        const slots = getRosterSlotsByGroup(group.id)

        return (
          <div key={group.id} className={s.group}>
            <h2 className={s.heading}>Roster — {group.label}</h2>
            <ul className={s.slotList}>
              {slots.map((slot) => {
                const value = draft.slots[slot.number] ?? {
                  name: "",
                  title: "",
                  position: slot.position,
                  photoUrl: "",
                }
                const resolvedPhoto = resolveSlotPhotoSrc(
                  value.name,
                  value.photoUrl,
                  playerLibrary,
                  ""
                )
                // Empty string from resolve means crest-fallback with no crest here
                // — treat as "no thumb" rather than showing a broken image.
                const photoUrl = resolvedPhoto || null

                return (
                  <li key={slot.number} className={s.slotItem}>
                    <span className={s.jersey} aria-hidden="true">
                      {slot.number}
                    </span>
                    <input
                      id={`pos-${slot.number}`}
                      type="text"
                      className={s.posInput}
                      value={value.position}
                      placeholder={slot.position}
                      aria-label={`Position for jersey ${slot.number}`}
                      onChange={(event) =>
                        onSlotChange(slot.number, {
                          position: event.target.value,
                        })
                      }
                    />
                    <PlayerNameCombobox
                      id={`name-${slot.number}`}
                      value={value.name}
                      library={playerLibrary}
                      usedElsewhere={usedNames}
                      placeholder="Player name"
                      aria-label={`Player name for jersey ${slot.number}`}
                      onChange={(name) => onSlotChange(slot.number, { name })}
                    />
                    <input
                      id={`title-${slot.number}`}
                      type="text"
                      className={s.titleInput}
                      value={value.title}
                      placeholder="C, VC"
                      maxLength={3}
                      aria-label={`Title for jersey ${slot.number} (e.g. C, VC)`}
                      title="Title (C, VC)"
                      onChange={(event) =>
                        onSlotChange(slot.number, {
                          title: event.target.value,
                        })
                      }
                    />
                    {photoUrl ? (
                      <span className={s.thumb}>
                        <Image
                          src={photoUrl}
                          alt=""
                          fill
                          className={s.thumbImg}
                          loading="eager"
                        />
                      </span>
                    ) : (
                      <span className={s.thumbSlot} aria-hidden="true" />
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
