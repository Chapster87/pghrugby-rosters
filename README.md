# Pittsburgh Forge Roster Builder

Client-side tool for building weekly **Matchday Squad** graphics for Pittsburgh Forge rugby social media.

Built with Next.js (App Router, static export), TypeScript, and CSS Modules.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the homepage **is** the builder.

Static hosting (DreamHost): `pnpm build` emits an export under `out/` (see `next.config.ts` `output: "export"`).

## What it does

- Enter weekly **Match Details** (opponent, date, kickoff, venue, competition, address)
- Manage a **Player Library** (name → photo URL, including Google Drive links)
- Fill **Roster Slots** 1–23 (forwards / backs / finishers)
- Attach **Sponsor** logos and the **Club Logo**
- Preview **Portrait (1080×1350)** and **Story (1080×1920)** formats
- Export PNG for social posting

Draft, library, sponsors, and club logo persist in the browser (`localStorage`).

## Scripts

| Command      | Description                |
| ------------ | -------------------------- |
| `pnpm dev`   | Local development server   |
| `pnpm build` | Production static export   |
| `pnpm start` | Serve the production build |
| `pnpm lint`  | ESLint                     |

## Domain language

See [`CONTEXT.md`](./CONTEXT.md) for product terms (Matchday Squad, Roster Slot, Draft, etc.).

## Reference

Legacy single-file tool: [`roster-generator.html`](./roster-generator.html) (behavior reference; feed format in the app is Portrait 1080×1350, not the HTML’s 1080×1080 square).
