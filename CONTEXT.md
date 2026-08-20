# Pittsburgh Forge Roster Graphics

Client-side tool for building weekly matchday roster graphics for Pittsburgh Forge rugby social media.

## Language

**Matchday Squad**:
The full set of players named for a match, shown on the graphic.
_Avoid_: Team sheet (unless quoting external rugby usage), lineup card, roster (as a product noun)

**Roster Slot**:
A numbered place on the Matchday Squad with a position label and optional player name. Slots 1–15 are fixed; finishers are dynamic from jersey 16 upward.
_Avoid_: Row, field, position slot

**Finisher**:
A Roster Slot from jersey 16 upward on the bench. Finishers are index-numbered, added only when filled (no empty finisher rows). Default bench runs through 23; more are allowed.
_Avoid_: Reserve (unless UI copy), sub row

**Position**:
The role label on a Roster Slot (e.g. Hooker, Fly-half, Finisher). Defaults come from standard rugby numbering; the operator may edit the label.
_Avoid_: Role, job

**Player Library**:
The operator’s saved map of player display names to photo URLs, used to fill Roster Slot photos by name match. One shared library across Leagues for now.
_Avoid_: Squad database, roster DB, contacts

**Club Logo**:
The crest image used in the graphic header and as the fallback when a player has no library photo.
_Avoid_: Team badge (unless UI copy), favicon

**Sponsor**:
A logo image in one of a fixed set of sponsor slots on the graphic.
_Avoid_: Partner mark, advert

**League**:
Which Forge program a Matchday Squad belongs to: Men’s or Women’s. Required on every cloud save. Distinct from Match Type value “League.”
_Avoid_: Side, team (when meaning men/women), gender

**Division**:
Optional short label within a League (e.g. a flight or level).
_Avoid_: Tier (unless quoting external usage)

**Match Type**:
Kind of fixture: League (championship pathway), Friendly, Playoff, or Tour. Default League. Not the same concept as the League field (men’s/women’s).
_Avoid_: Game type, fixture type

**Match Details**:
League, opponent, date, kickoff, venue (home/away), Match Type, optional Division and address shown on the graphic header.
_Avoid_: Game info, fixture block, Competition (retired field name)

**Background Image**:
Full-bleed image behind the Matchday Squad graphic. One shared default for all Graphic Formats; Story may optionally override.
_Avoid_: Wallpaper, canvas background

**Graphic Format**:
A fixed export size for social: Portrait (1080×1350, Instagram feed standard) or Story (1080×1920).
_Avoid_: Canvas size, preset, template size, Square (unless quoting legacy HTML; the feed format is Portrait, not 1:1)

**Draft**:
The working Match Details, Roster Slots, branding, and related builder state. Autosaved locally in the browser; Save pushes or updates a cloud-backed copy.
_Avoid_: Save file, document, roster (as a product noun)

**Export**:
Downloading a Graphic Format as a PNG for social posting.
_Avoid_: Render, screenshot (except when describing implementation)

**Operator**:
An invited person who may create, edit, save, and delete cloud Drafts (Forge coach/admin). Sign-in is required for writes.
_Avoid_: User (when domain-specific), admin, editor

**Reviewer**:
Anyone with the Draft’s normal app URL who may view it read-only without signing in.
_Avoid_: Public user, guest editor
