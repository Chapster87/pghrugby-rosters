"use client"

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import Image from "next/image"
import * as Popover from "@radix-ui/react-popover"
import clsx from "clsx"

import type { PlayerLibrary } from "../../_static/builder-types"

import s from "./style.module.css"

type PlayerNameComboboxProps = {
  /** Input id (uniqueness is the caller's job, e.g. `name-${slot.number}`). */
  id: string
  /** Current slot name — free text is always allowed. */
  value: string
  /** Active League's photo library: names (and photos) for suggestions. */
  library: PlayerLibrary
  /**
   * Names already used by any Roster Slot — hidden from suggestions (each
   * library player can only be picked once per Roster). Comparison is
   * case-insensitive. Lowercased by the caller.
   */
  usedElsewhere?: ReadonlySet<string>
  placeholder?: string
  "aria-label"?: string
  onChange: (name: string) => void
}

/**
 * Roster Slot name input with a Radix Popover suggestion list fed by the
 * active League's Player Library. The user may keep typing any name; picking
 * a suggestion sets the exact library key so the photo fills in.
 */
export default function PlayerNameCombobox({
  id,
  value,
  library,
  usedElsewhere,
  placeholder,
  onChange,
  "aria-label": ariaLabel,
}: PlayerNameComboboxProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listId = `${id}-suggestions`
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<Array<HTMLLIElement | null>>([])

  const names = useMemo(
    () => Object.keys(library).sort((a, b) => a.localeCompare(b)),
    [library]
  )

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase()
    const pool = query
      ? names.filter((name) => name.toLowerCase().includes(query))
      : names
    if (!usedElsewhere || usedElsewhere.size === 0) return pool
    // Hide everyone already placed in this Roster — no name may be re-picked.
    return pool.filter((name) => !usedElsewhere.has(name.toLowerCase()))
  }, [names, value, usedElsewhere])

  const clampedIndex =
    matches.length === 0 ? -1 : Math.min(activeIndex, matches.length - 1)

  function openList() {
    if (matches.length === 0) return
    setActiveIndex(0)
    setOpen(true)
  }

  function select(name: string) {
    onChange(name)
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        openList()
      }
      return
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        if (matches.length > 0) {
          setActiveIndex((i) => (i + 1) % matches.length)
        }
        break
      case "ArrowUp":
        event.preventDefault()
        if (matches.length > 0) {
          setActiveIndex((i) => (i - 1 + matches.length) % matches.length)
        }
        break
      case "Enter": {
        event.preventDefault()
        const selected = matches[clampedIndex]
        if (selected) select(selected)
        break
      }
      case "Tab":
        setOpen(false)
        break
    }
  }

  // Keep the highlighted option in view while arrow-keying through a long pool.
  useEffect(() => {
    if (!open) return
    itemRefs.current[clampedIndex]?.scrollIntoView({ block: "nearest" })
  }, [clampedIndex, open])

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <input
          ref={inputRef}
          id={id}
          name={`player-${id}`}
          type="text"
          className={s.input}
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && clampedIndex >= 0 ? `${listId}-${clampedIndex}` : undefined
          }
          onChange={(event) => {
            onChange(event.target.value)
            if (event.target.value.trim()) setActiveIndex(0)
          }}
          onFocus={openList}
          onKeyDown={handleKeyDown}
        />
      </Popover.Anchor>

      <Popover.Content
        className={s.menuContent}
        align="start"
        sideOffset={4}
        collisionPadding={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {matches.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            aria-label="Player suggestions"
            className={s.list}
          >
            {matches.map((name, index) => (
              <li
                key={name}
                ref={(element) => {
                  itemRefs.current[index] = element
                }}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === clampedIndex}
                className={clsx(s.item, index === clampedIndex && s.active)}
                onPointerDown={(event) => {
                  event.preventDefault()
                  select(name)
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {library[name] ? (
                  <Image
                    src={library[name]}
                    alt=""
                    width={24}
                    height={24}
                    className={s.itemThumb}
                  />
                ) : (
                  <span className={s.itemThumbEmpty} aria-hidden="true" />
                )}
                <span className={s.itemName}>{name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.noMatch}>
            {value.trim()
              ? "No library matches — keep typing"
              : "All library players are already in this Roster"}
          </p>
        )}
      </Popover.Content>
    </Popover.Root>
  )
}
