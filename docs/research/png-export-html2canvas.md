# PNG Export via html2canvas (Next static export)

**Question:** Can we ship PNG Export on this stack using `html2canvas` as the baseline?

**Stack:** Next.js 16.2.1 App Router · React 19.2.4 · `output: "export"` · client components OK · Graphic Formats Portrait 1080×1350 + Story 1080×1920 · remote player photos (historically Google Drive) via CORS/proxy.

**Date:** 2026-03-19

---

## 1. Recommendation

**Yes — use `html2canvas` as the baseline.** It is a pure client-side DOM→canvas library, needs no Node server, and matches the proven pattern in `roster-generator.html`. Nothing in Next static export blocks shipping it.

### Install (pnpm)

```bash
pnpm add html2canvas
```

Official install: `npm install --save html2canvas` ([html2canvas homepage](https://html2canvas.hertzen.com/)). Published package version in use by the HTML tool / CDN: **1.4.1** ([npm `html2canvas`](https://www.npmjs.com/package/html2canvas)).

Optional types if needed: `@types/html2canvas` is often unnecessary for 1.4.x (package may ship its own); add only if TypeScript complains.

### Import pattern (App Router client component)

Prefer **dynamic `import()` inside a click handler** so the library never runs during SSR/prerender:

```tsx
'use client'

async function exportPng(el: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default
  // clone-offscreen + html2canvas(...) — see §3
}
```

Rationale:

- html2canvas is **browser-only** (DOM + canvas); the package docs state it is “not suitable to be used in nodejs” ([npm readme](https://www.npmjs.com/package/html2canvas)).
- Next Client Components still prerender on the server during `next build` for static export; browser APIs must be accessed only in the browser ([static exports — Browser APIs](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)).
- Next documents loading external libraries on demand with `await import(...)` from client event handlers ([lazy loading](https://nextjs.org/docs/app/guides/lazy-loading)).
- Mark the Export UI with `'use client'` when it needs event handlers / browser APIs ([Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)).

**Prefer the npm package over a CDN `<script>`** so the static export bundles a pinned version into `/_next/static` assets. CDN is fine for the standalone HTML prototype; Next already owns the client bundle.

### Suggested call options (from reference HTML)

```js
html2canvas(clone, {
  backgroundColor: null, // transparent; default is #ffffff
  scale: 1,              // 1 CSS px → 1 canvas px (export full Graphic Format size)
  useCORS: true,         // attempt CORS image loads — see §2
})
```

Config defaults and meanings: [html2canvas configuration](https://html2canvas.hertzen.com/configuration).

---

## 2. CORS / `useCORS` / remote photos

### Canvas taint (why this matters)

Drawing a cross-origin image **without** CORS approval **taints** the canvas. A tainted canvas throws on `toDataURL()` / `toBlob()` / `getImageData()` ([MDN — Use cross-origin images in a canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image); [MDN — `toDataURL` `SecurityError`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL)).

Export PNG via `canvas.toDataURL('image/png')` therefore **requires** every drawn remote photo to be origin-clean (same-origin **or** CORS-enabled with `crossOrigin`).

### Is `useCORS: true` enough?

**No — not by itself.**

| Option | Default | Meaning ([config docs](https://html2canvas.hertzen.com/configuration)) |
| --- | --- | --- |
| `useCORS` | `false` | Attempt to load images from a server **using CORS** |
| `allowTaint` | `false` | Allow cross-origin images to taint the canvas (breaks export) |
| `proxy` | `null` | URL of a same-origin proxy for cross-origin images; if empty, cross-origin images won’t be loaded that way |

html2canvas’s own proxy page: it **does not** bypass browser content policy; cross-origin draws taint the canvas; load outside-origin images via a **proxy** or CORS ([html2canvas proxy docs](https://html2canvas.hertzen.com/proxy)).

So for remote photos you need **both**:

1. **`useCORS: true`** (and keep `allowTaint: false`), **and**
2. Image responses that include CORS headers the browser accepts (typically `Access-Control-Allow-Origin`), with the image loaded in CORS mode (`crossOrigin = "anonymous"` on `<img>` — [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image)).

### Google Drive pattern (keep the proxy)

Drive thumbnail/share URLs historically **do not** send the CORS headers canvas export needs. The reference HTML routes through **images.weserv.nl**:

```js
// Drive thumbnail → CORS-friendly cache/resize proxy
return `https://images.weserv.nl/?url=${encodeURIComponent(driveUrl)}`
```

[wsrv.nl docs](https://images.weserv.nl/docs/): image cache & resize CDN; pass origin URL via `?url=`. Querystrings in the origin URL must be URL-encoded. Prefer `https://wsrv.nl/` (or the `images.weserv.nl` host already used in-repo) for TLS.

**Implementer checklist for photos:**

1. Never point export-bound `<img src>` at raw Drive URLs.
2. Rewrite through a CORS-capable image proxy (weserv as today) **or** host photos same-origin under `public/`.
3. Set `crossOrigin="anonymous"` on remote `<img>` elements used in the graphic.
4. Call html2canvas with `useCORS: true`.
5. Do **not** set `allowTaint: true` if you need PNG download.
6. If a host still fails CORS, use html2canvas’s `proxy` option pointing at a **same-origin** proxy — but **`output: "export"` has no Node/API routes at runtime**, so you cannot add a Next Route Handler proxy on DreamHost static hosting ([unsupported features on static export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)). Stick to a third-party CORS image CDN or same-origin static files.

---

## 3. Clone-offscreen pattern

### Reference (still correct)

```js
function exportImage(elId, filename) {
  const el = document.getElementById(elId)
  const clone = el.cloneNode(true)
  clone.style.position = 'absolute'
  clone.style.left = '-99999px'
  clone.style.top = '0'
  clone.style.transform = 'none'
  document.body.appendChild(clone)
  html2canvas(clone, { backgroundColor: null, scale: 1, useCORS: true }).then((canvas) => {
    document.body.removeChild(clone)
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
  })
}
```

**Keep this approach.** Reasons grounded in primary sources:

1. **Preview is CSS-scaled; export must not be.** The HTML tool wraps full-size graphics in `transform: scale(...)` for on-screen fit. html2canvas has only **limited** `transform` support and does **not** support `zoom` ([features / unsupported CSS](https://html2canvas.hertzen.com/features)). Cloning and forcing `transform: 'none'` captures the true 1080×1350 / 1080×1920 layout.
2. **`scale: 1`** on html2canvas means canvas pixels track the element’s layout size (default is `window.devicePixelRatio`, which would oversample) ([configuration](https://html2canvas.hertzen.com/configuration)).
3. Offscreen `position: absolute; left: -99999px` avoids flashing a full-size clone; html2canvas reads layout/styles from the live DOM tree it is given.

### Next-specific gotchas

| Topic | Guidance |
| --- | --- |
| **CSS Modules** | `cloneNode(true)` copies hashed `className` values already on the DOM. Global stylesheets injected by Next still apply. Prefer exporting a ref to the **graphic root** that owns fixed pixel width/height (1080×…), not a scaled wrapper. Avoid relying on selectors that depend on parent structure outside the clone. |
| **Scaled previews** | Mirror the HTML tool: scale only an outer wrapper for display; keep an inner node at **exact Graphic Format dimensions** for both paint and export. Always strip transforms on the export target. |
| **Absolute positioning** | Fine for the offscreen clone. Ensure the clone’s width/height are explicit (inline or CSS on the root) so layout doesn’t collapse when detached from the scaled wrapper. |
| **`onclone`** | Optional hook to tweak the cloned document before render without touching the visible tree ([configuration](https://html2canvas.hertzen.com/configuration)). Useful if you must force `crossOrigin` or hide UI chrome via `data-html2canvas-ignore`. |
| **Cleanup** | Always `removeChild(clone)` in `finally` so failed exports don’t leave nodes behind. |
| **Download API** | `toDataURL('image/png')` + temporary `<a download>` matches the prototype. MDN notes large data-URLs can be heavy; `toBlob` + `URL.createObjectURL` is a nicer upgrade later ([MDN toDataURL](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL)) — not required for v1. |

### Target sizes

- Portrait: **1080×1350**
- Story: **1080×1920**

Export the node whose laid-out size is already those pixels (not the scaled preview box).

---

## 4. Next.js / static-export gotchas

| Concern | Verdict | Source |
| --- | --- | --- |
| `output: "export"` | **OK.** Build emits static HTML/CSS/JS; client libraries ship as static assets. No server needed at runtime. | [Static exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports) |
| Runtime image proxy Route Handler | **Not available** on static export (no dynamic server). Use weserv/third-party or files in `public/`. | Same page — unsupported: Request-dependent Route Handlers, etc. |
| `'use client'` | Required for Export button / handlers / browser APIs. | [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) |
| SSR of html2canvas | **Do not** import at module top in a way that executes canvas code during prerender. Dynamic `import()` on user action (or `next/dynamic` with `ssr: false` for a wrapper component). | [Browser APIs on static export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports); [lazy loading](https://nextjs.org/docs/app/guides/lazy-loading); npm “not suitable for nodejs” |
| CDN vs npm | **npm + pnpm** for this app; lockfile pins 1.4.x; bundled into export. | [html2canvas install](https://html2canvas.hertzen.com/) |
| `images.unoptimized: true` | Orthogonal to html2canvas. Affects `next/image` only. For export fidelity, plain `<img>` (or unoptimized `next/image` that still renders a normal img) is simpler for CORS attributes. | Repo `next.config.ts`; [static export image notes](https://nextjs.org/docs/app/building-your-application/deploying/static-exports) |
| React 19 / Next 16 | No documented incompatibility: html2canvas operates on DOM nodes, not React internals. Pass an `HTMLElement` from a ref. | Library model: [homepage](https://html2canvas.hertzen.com/) |

---

## 5. Alternatives (only if baseline fails QA)

**html2canvas is not blocked on this stack.** Use alternatives only if Export QA hits material fidelity gaps.

Known html2canvas CSS gaps that could matter for graphics ([unsupported list](https://html2canvas.hertzen.com/features)):

- `box-shadow`, `filter`, `object-fit`, `background-blend-mode`, `mix-blend-mode`
- `transform` — limited (another reason to export unscaled DOM)
- Does not take a real OS screenshot; it rebuilds from DOM/CSS ([npm readme](https://www.npmjs.com/package/html2canvas))

**Concrete fallback if fidelity fails:** evaluate **`modern-screenshot`** (or similar maintained DOM→image libs) behind the same clone-offscreen + CORS photo pipeline — still client-only, still static-export-safe. Do **not** plan on native SVG `foreignObject` as the primary path (inconsistent cross-browser CORS/CSS). Do **not** plan on server-side screenshotting (no Node on DreamHost static host).

The existing `roster-generator.html` already ships acceptable PNGs with html2canvas 1.4.1 + weserv + clone-offscreen; port that pipeline first.

---

## 6. Implementer checklist (Export ticket)

1. `pnpm add html2canvas`
2. Client-only Export control (`'use client'`)
3. `const html2canvas = (await import('html2canvas')).default` on click
4. Graphic roots at 1080×1350 and 1080×1920; preview scale on an outer wrapper only
5. Clone → offscreen → `transform: none` → `html2canvas(..., { backgroundColor: null, scale: 1, useCORS: true })` → remove clone → PNG download
6. Photo URLs: weserv (or same-origin); `crossOrigin="anonymous"`; never raw Drive for export-bound images
7. Smoke-test both Graphic Formats with remote photos; confirm no `SecurityError` on `toDataURL`

---

## Sources

| Claim area | Primary source |
| --- | --- |
| html2canvas API, options, client-only | https://html2canvas.hertzen.com/ · https://html2canvas.hertzen.com/configuration · https://html2canvas.hertzen.com/features · https://html2canvas.hertzen.com/proxy · https://www.npmjs.com/package/html2canvas |
| Canvas CORS / taint / `toDataURL` | https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image · https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL |
| Next static export, client components, dynamic import | https://nextjs.org/docs/app/building-your-application/deploying/static-exports · https://nextjs.org/docs/app/getting-started/server-and-client-components · https://nextjs.org/docs/app/guides/lazy-loading |
| Image proxy | https://images.weserv.nl/docs/ |
| In-repo reference | `roster-generator.html` (`exportImage`, Drive→weserv rewrite) · `next.config.ts` (`output: "export"`) |
