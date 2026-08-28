# Roster Slot photos are frozen on the Roster

Past matchday Rosters must not change when the shared Player Library is edited later. We freeze each filled slot’s photo URL onto the Roster itself (`state.roster[n].photo_url` / `draft.slots[n].photoUrl`) at pick and Save time, instead of a separate archive table or always live name lookup.

Considered and rejected: a new JSONB archive table (extra surface for the same payload already on `roster_drafts.state`); always-live library lookup (is what made old graphics drift).

Consequences: legacy rows without `photo_url` still resolve by name until the next Save freezes them; `data:` images still do not round-trip to cloud (existing URL-only contract).
