# Pittsburgh Forge Roster Graphics

Client-side tool for building weekly matchday roster graphics for Pittsburgh Forge rugby social media.

## Language

**Matchday Squad**:
The full set of players named for a match, shown on the graphic.
_Avoid_: Team sheet (unless quoting external rugby usage), lineup card

**Roster Slot**:
A numbered place on the Matchday Squad (jersey 1–23) with a position label and optional player name.
_Avoid_: Row, field, position slot

**Position**:
The role label on a Roster Slot (e.g. Hooker, Fly-half, Finisher). Defaults come from standard rugby numbering; the operator may edit the label.
_Avoid_: Role, job

**Player Library**:
The operator’s saved map of player display names to photo URLs, used to fill Roster Slot photos by name match.
_Avoid_: Squad database, roster DB, contacts

**Club Logo**:
The crest image used in the graphic header and as the fallback when a player has no library photo.
_Avoid_: Team badge (unless UI copy), favicon

**Sponsor**:
A logo image in one of a fixed set of sponsor slots on the graphic.
_Avoid_: Partner mark, advert

**Match Details**:
Opponent, date, kickoff, venue (home/away), competition, and optional address shown on the graphic header.
_Avoid_: Game info, fixture block

**Graphic Format**:
A fixed export size for social: Portrait (1080×1350, Instagram feed standard) or Story (1080×1920).
_Avoid_: Canvas size, preset, template size, Square (unless quoting legacy HTML; the feed format is Portrait, not 1:1)

**Draft**:
The in-progress Match Details and Roster Slot names/positions persisted in the browser between sessions.
_Avoid_: Save file, document

**Export**:
Downloading a Graphic Format as a PNG for social posting.
_Avoid_: Render, screenshot (except when describing implementation)

**Operator**:
The person using the tool to build graphics (Forge coach/admin).
_Avoid_: User (when domain-specific), admin, editor
