# Supabase Auth and RLS on Next.js static export

**Question:** Can this repo stay on Next.js static export (`output: "export"`) while using the Supabase JS client in the browser for invite-only Auth (Google + email), RLS (anonymous Reviewer read by row id; authenticated Operator write), and session persistence on a static DreamHost deploy (public URL + anon/publishable key only)?

**Stack:** Next.js 16 App Router · React 19 · `output: "export"` (see `next.config.ts`) · DreamHost static hosting · shared Supabase project with [cms-starter](https://github.com/Chapster87/cms-starter) · domain terms in root `CONTEXT.md` (Operator, Reviewer, Draft).

**Date:** 2026-08-19

---

## 1. Recommendation

**Yes — stay on static export.** Nothing in the Auth / RLS / session requirements forces a Node server, `@supabase/ssr`, cookies, Proxy/middleware, or Route Handlers at runtime.

| Requirement | Fits static export? | Approach |
| --- | --- | --- |
| Invite-only Operators (Google + email) | **Yes** | Dashboard / Admin API invites (operator-provisioned, not in the static app); app only signs **in** existing users |
| RLS: Reviewer read by row id; Operator insert/update/delete | **Yes** | Postgres RLS + grants on `anon` / `authenticated`; enforced by Supabase Data API, not Next |
| Session persistence on DreamHost | **Yes** | Browser `createClient` + default `localStorage` session (`persistSession: true`, auto-refresh) |
| Env: public URL + anon/publishable key only | **Yes** | Documented client pattern; secret/`service_role` never in the browser |
| Abandon static export? | **No** | Only if a later ticket demands server-only features (see §6) |

**Do not copy cms-starter’s SSR path** into this app while it stays static. cms-starter uses `@supabase/ssr` (cookie browser client + server client + auth callback route). Those patterns need cookies, Proxy, and request-time Route Handlers — all **unsupported** under `output: "export"` ([Next.js static exports — Unsupported Features](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)). Treat cms-starter as a **shared Auth project / table-name boundary**, not as a client template.

---

## 2. Browser client on static export

### What Next static export allows

- Build emits static HTML/CSS/JS; any host that serves static files works ([Static exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)).
- **Client Components** can fetch at runtime (SPA-style), e.g. with SWR against an external API ([same page — Client Components](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)).
- Browser APIs (`window`, `localStorage`) must run only in the browser (`useEffect` / event handlers), because Client Components still prerender at build ([Browser APIs](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)).

### What static export does **not** allow (relevant to Supabase SSR)

Unsupported and therefore unavailable on DreamHost static hosting ([Unsupported Features](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)):

- Cookies (Next cookie APIs)
- Proxy / middleware
- Server Actions
- Route Handlers that depend on the incoming Request
- Dynamic server redirects/rewrites/headers

So: **no** cookie session bridge, **no** `app/auth/callback/route.ts` exchange handler, **no** server-only invite endpoint inside this Next app.

### Correct client for this app

Use **`@supabase/supabase-js`** `createClient` in client code only — the documented browser client ([JavaScript client — Initializing](https://supabase.com/docs/reference/javascript/initializing)):

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // or publishable key — see §5
)
```

Google docs explicitly allow this when not using SSR:

> If you're not using Server-Side Rendering or cookie-based Auth, you can directly use the `createClient` from `@supabase/supabase-js`.  
> ([Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google))

**Package choice**

| Package | Role here |
| --- | --- |
| `@supabase/supabase-js` | **Required** — browser Auth + Data API |
| `@supabase/ssr` | **Not required** (and cookie/Proxy patterns won’t run on static export) |

Env vars must be `NEXT_PUBLIC_*` so the static bundle can read them at runtime/build. Never put a secret / `service_role` key in `NEXT_PUBLIC_*` ([Understanding API keys](https://supabase.com/docs/guides/api/api-keys)).

---

## 3. Auth: invite-only Google + email

### 3.1 Email password sign-in (Operators)

- Email auth is enabled by default; sign-in is `signInWithPassword({ email, password })` ([Password-based Auth](https://supabase.com/docs/guides/auth/passwords)).
- Implicit flow is the **default for JavaScript** client-only apps; tokens land in the browser without a server code exchange ([Password-based Auth — flows](https://supabase.com/docs/guides/auth/passwords); GoTrue defaults `flowType: 'implicit'` in auth-js).

### 3.2 Google OAuth (Operators)

Dashboard + Google Cloud setup ([Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)):

1. Google Cloud OAuth **Web** client.
2. **Authorized JavaScript origins:** production DreamHost origin (and local dev origin while developing).
3. **Authorized redirect URIs:** Supabase callback (`https://<project-ref>.supabase.co/auth/v1/callback`).
4. Paste Client ID + secret into Supabase **Authentication → Providers → Google**.

App call (client-only, implicit flow):

```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://your-dreamhost-site.example/', // must be on allow list
  },
})
```

With default **implicit** flow, after Google consent the user returns to the app with tokens in the URL; `detectSessionInUrl: true` (default) picks them up and persists the session ([Initializing options](https://supabase.com/docs/reference/javascript/initializing); [Login with Google — implicit](https://supabase.com/docs/guides/auth/social-login/auth-google)).

**PKCE note:** PKCE is preferred for SSR and needs a code exchange step. On a pure static site you *can* set `flowType: 'pkce'` and let the browser client call `exchangeCodeForSession` (still no Next Route Handler required if exchange runs in the client). Defaults already favor **implicit** for JS SPAs; either works without abandoning static export. Prefer keeping defaults unless a concrete threat model pushes PKCE.

### 3.3 Invite-only (no public sign-up)

Supabase supports blocking open registration:

| Control | Where | Source |
| --- | --- | --- |
| `auth.enable_signup` | Project Auth settings / CLI `config.toml` | [CLI config — `auth.enable_signup`](https://supabase.com/docs/guides/local-development/cli/config) (“Allow/disallow new user signups”) |
| `auth.email.enable_signup` | Email provider | [CLI config — `auth.email.enable_signup`](https://supabase.com/docs/guides/local-development/cli/config) |
| Do not expose `signUp()` in the UI | App | Product choice |

**Creating Operators (admin, not this static app):**

1. **Dashboard:** Authentication → Users → Add user → **Send invitation** ([Users — Inviting users](https://supabase.com/docs/guides/auth/users)).
2. **Admin API:** `supabase.auth.admin.inviteUserByEmail(email, { redirectTo })` with the **secret** key on a trusted machine only ([Users](https://supabase.com/docs/guides/auth/users); [JS — `inviteUserByEmail`](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)).

Important constraints from primary docs:

- Invite is an **admin** action; secret key must never ship in the browser ([Users](https://supabase.com/docs/guides/auth/users); [API keys](https://supabase.com/docs/guides/api/api-keys)).
- `inviteUserByEmail` does **not** support PKCE (invite browser ≠ accept browser) ([JS reference](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)).
- `redirectTo` on invites must be on the Redirect URL allow list or it is ignored in favor of Site URL ([Users](https://supabase.com/docs/guides/auth/users); [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)).

**Google + disabled signups:** With project-level signups disabled, unknown Google accounts should not self-register. Operators should exist first (invite / admin create). Coordinate with cms-starter: **Auth users are project-global** on the shared Supabase project — an Operator invited for this roster app is a user in the same `auth.users` pool cms-starter already uses.

**App surface:** only sign-in (email password + Google) and sign-out. No public sign-up form. Reviewers never authenticate ([CONTEXT.md](../../CONTEXT.md)).

### 3.4 Redirect / Site URL checklist (DreamHost)

Configure under **Authentication → URL Configuration** ([Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)):

| Setting | Suggested value |
| --- | --- |
| **Site URL** | Production static origin, e.g. `https://rosters.example.com` (not `localhost`) |
| **Redirect URLs** | Exact production URLs used in `redirectTo` / invite links; local `http://localhost:<port>/**` while developing |
| Google JS origins | Same production (and dev) origins |

This repo already uses `trailingSlash: true` in `next.config.ts`; keep redirect URLs consistent with trailing slashes if paths are used.

---

## 4. RLS model for Drafts

Authorization is enforced in Postgres via grants + policies, not in Next. The browser always uses the publishable/anon key; logged-in Operators attach a user JWT so PostgREST runs as role `authenticated`, otherwise `anon` ([API keys — interaction with Auth](https://supabase.com/docs/guides/api/api-keys); [RLS](https://supabase.com/docs/guides/auth/row-level-security)).

### 4.1 Target matrix (domain)

| Actor | Supabase role | Draft access |
| --- | --- | --- |
| **Reviewer** (no account; has app URL with row id) | `anon` | `SELECT` only |
| **Operator** (invited, signed in) | `authenticated` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |
| Service / admin tooling | `service_role` (secret key) | Bypass RLS — **never in client** |

### 4.2 Illustrative SQL (table name TBD — avoid cms-starter collisions)

Table name is out of scope for this ticket (see grilling/schema work). Pattern only:

```sql
-- After table exists:
alter table public.<roster_drafts> enable row level security;

revoke all on table public.<roster_drafts> from anon, authenticated;

grant select on table public.<roster_drafts> to anon;
grant select, insert, update, delete on table public.<roster_drafts> to authenticated;

-- Reviewers + Operators can read rows (Reviewer UX: client filters by id)
create policy "drafts_select_public"
  on public.<roster_drafts>
  for select
  to anon, authenticated
  using ( true );

create policy "drafts_insert_operators"
  on public.<roster_drafts>
  for insert
  to authenticated
  with check ( true );

create policy "drafts_update_operators"
  on public.<roster_drafts>
  for update
  to authenticated
  using ( true )
  with check ( true );

create policy "drafts_delete_operators"
  on public.<roster_drafts>
  for delete
  to authenticated
  using ( true );
```

Grounded in official patterns:

- Enable RLS; revoke then grant least privilege ([Secure a table with RLS](https://supabase.com/docs/guides/auth/row-level-security)).
- Separate policies per command; name roles with `TO` ([same](https://supabase.com/docs/guides/auth/row-level-security)).
- Example grant shape `grant select … to anon` + full DML to `authenticated` appears in the JS client Data API notes ([Initializing — Enable Data API access](https://supabase.com/docs/reference/javascript/initializing)).
- `UPDATE`/`DELETE` need a visible `SELECT` policy for the same rows ([RLS — UPDATE policies](https://supabase.com/docs/guides/auth/row-level-security)).

Tighten later with `auth.uid() = created_by` (etc.) if Operators should not edit each other’s Drafts — not required by the current map destination (“invite-only write”).

### 4.3 Security property of “read by row id”

With `using ( true )` on `SELECT` for `anon`, **any holder of the publishable/anon key can list all Draft rows** via the Data API, not only open a known id. The public key is in the static bundle by design ([API keys](https://supabase.com/docs/guides/api/api-keys)).

That matches the map preference (share = normal app URL by row id; revocable share tokens out of scope) but is **not** secrecy-by-URL alone against a determined reader of the network tab. Accept this, or later add a narrower design (e.g. security-definer RPC, or authenticated-only list + separate public read token column) — product choice, not a static-export blocker.

### 4.4 Client usage sketch

```ts
// Reviewer or Operator — read one Draft
const { data, error } = await supabase
  .from('<roster_drafts>')
  .select('*')
  .eq('id', draftId)
  .maybeSingle()

// Operator only — write (fails under RLS if session missing)
const { error: saveError } = await supabase
  .from('<roster_drafts>')
  .upsert({ /* metadata + json state */ })
```

---

## 5. Session persistence (static DreamHost)

| Concern | Finding | Source |
| --- | --- | --- |
| Default storage | Browser client persists session to **localStorage** when `persistSession` is true (default) | [JS Auth overview](https://supabase.com/docs/reference/javascript/auth-signup) (“By default, the supabase client sets `persistSession` to true and attempts to store the session in local storage”) |
| Auto refresh | Default `autoRefreshToken: true`; access JWT short-lived, refresh token rotated | [User sessions](https://supabase.com/docs/guides/auth/sessions); [Initializing options](https://supabase.com/docs/reference/javascript/initializing) |
| Multi-tab | `BroadcastChannel` keeps auth state aligned across tabs when using default storage | auth-js `GoTrueClient` behavior (library source) |
| HTTP-only cookies | **Not** the right model for a client-rich SPA; docs say JS apps need access to tokens in the browser | [User sessions — HTTP-only cookies](https://supabase.com/docs/guides/auth/sessions) |
| Keys in client | Publishable / legacy `anon` only; secret / `service_role` forbidden in browser | [API keys](https://supabase.com/docs/guides/api/api-keys) |
| Sign out | `signOut()` clears local session storage | [JS `signOut`](https://supabase.com/docs/reference/javascript/auth-signout) |

**Recommended client options** (defaults are already correct for SPA):

```ts
createClient(url, anonOrPublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // flowType: 'implicit' // JS default — fine for static SPA
  },
})
```

Listen with `onAuthStateChange` for UI (Operator chrome vs Reviewer read-only) ([JS `onAuthStateChange`](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)).

**Prerender caveat:** create the client in modules used only from Client Components, and don’t touch `localStorage` during SSR prerender beyond what the library already guards. Prefer a single shared browser client instance.

---

## 6. Must static export be abandoned?

### No — not for Auth / RLS / sessions

| Hypothetical reason to leave static | Needed for this ticket? |
| --- | --- |
| Cookie SSR session + Proxy refresh | No — localStorage SPA session is supported |
| Server Route Handler OAuth code exchange | No — implicit (default) or client-side PKCE exchange |
| In-app admin invite API with secret key | No — Dashboard / out-of-band admin; secret never in this app |
| Server-only RLS bypass for writes | No — Operators write as `authenticated` under RLS |
| Next middleware “protect route” | No — UI gates + RLS; static hosts can’t run Next middleware |

### Related static constraints (not Auth blockers)

These affect **routing/UX** tickets, not the Auth/RLS decision:

1. **Dynamic routes** like `/draft/[id]` without `generateStaticParams()` are unsupported on static export ([Unsupported Features](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)). Prefer a static shell page that reads the id from the path via client router **only if** the export can emit a catch-all, or use query/hash (`?id=`), or prebuild known ids (poor fit for new Drafts). Resolve in routes grilling — not a reason Auth needs a server.
2. **Landing list of Drafts** should load client-side after hydrate (allowed).
3. **cms-starter collision:** new tables must use roster-specific names; Auth providers/users are shared.

### When you *would* leave static later

Only if a future decision requires e.g. server-rendered per-request HTML with cookie auth, confidential server actions that hold the secret key inside this deploy, or request-time redirects based on session cookies. None of that is required by map #9’s standing prefs.

---

## 7. Required Supabase / Google dashboard settings (operator checklist)

Provisioned by a human with project access (no secrets in git):

1. **API keys:** copy Project URL + publishable (or legacy `anon`) key into host/CI env as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `…_PUBLISHABLE_KEY`). Do **not** put secret/`service_role` in the static app ([API keys](https://supabase.com/docs/guides/api/api-keys)).
2. **Auth → Providers:** Email enabled; Google enabled with Client ID/secret ([Google](https://supabase.com/docs/guides/auth/social-login/auth-google)).
3. **Auth → disable open signups:** turn off project (and email) signups so only invited/admin-created users exist ([`enable_signup`](https://supabase.com/docs/guides/local-development/cli/config)).
4. **Auth → URL configuration:** Site URL = DreamHost production origin; Redirect allow list includes production + local dev ([Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)).
5. **Google Cloud:** Web OAuth client JS origins + Supabase callback redirect URI ([Google](https://supabase.com/docs/guides/auth/social-login/auth-google)).
6. **Users:** invite Operators via Dashboard (or Admin API from a trusted machine) ([Users](https://supabase.com/docs/guides/auth/users)).
7. **SMTP:** production invite/recovery email needs custom SMTP; default SMTP is tightly limited ([Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)). Shared project may already have this from cms-starter — verify rather than assume.
8. **Table + RLS:** create roster-specific Draft table; enable RLS; grants/policies per §4; never rely on service role in the client ([RLS](https://supabase.com/docs/guides/auth/row-level-security)).
9. **Shared project:** confirm no table name clash with cms-starter; Auth user pool is shared.

Ticket #16 (provision table/env) is the natural follow-through for items 1, 8, and operator verification of 2–7.

---

## 8. Implementer summary (no feature work in this ticket)

1. Keep `output: "export"` in `next.config.ts`.
2. Add `@supabase/supabase-js` only (unless a future non-static decision is made).
3. Browser singleton `createClient(NEXT_PUBLIC_URL, NEXT_PUBLIC_ANON_OR_PUBLISHABLE)`.
4. Operator UI: `signInWithPassword`, `signInWithOAuth({ provider: 'google' })`, `signOut`, `onAuthStateChange`.
5. No `signUp` UI; no secret key; no `@supabase/ssr` cookie stack.
6. Draft CRUD through Supabase client; trust RLS for enforcement; UI reflects Reviewer vs Operator.
7. Coordinate invites + Google + signup-disabled flags on the **shared** project with cms-starter owners.

---

## 9. Verdict table

| # | Question | Answer |
| --- | --- | --- |
| 1 | Invite-only Google + email on static export? | **Yes** — browser client + dashboard invites + signup disabled |
| 2 | RLS Reviewer read / Operator write? | **Yes** — `anon` SELECT + `authenticated` DML policies |
| 3 | Session persistence with public keys only? | **Yes** — localStorage + auto refresh; no service role |
| — | Abandon static export? | **No** for Auth/RLS/session |

### Blockers

**None** that force leaving `output: "export"` for the stated Auth/RLS/session goals.

**Non-blocking risks / ops dependencies:**

- Open signup left enabled → public Operator self-registration.
- Secret key accidentally shipped → full RLS bypass.
- `anon` SELECT `using (true)` → full Draft enumeration via API.
- Shared Auth pool / table names with cms-starter.
- Production email delivery without custom SMTP.
- Dynamic Draft URLs need a static-export-friendly routing shape (separate from Auth).

---

## Sources

| Claim area | Primary source |
| --- | --- |
| Next static export capabilities / unsupported server features | https://nextjs.org/docs/app/building-your-application/deploying/static-exports |
| Browser `createClient`, auth options, Data API grants | https://supabase.com/docs/reference/javascript/initializing |
| Google OAuth web + non-SSR client | https://supabase.com/docs/guides/auth/social-login/auth-google |
| Email/password auth + implicit default for JS | https://supabase.com/docs/guides/auth/passwords |
| Invite users (Dashboard + Admin API) | https://supabase.com/docs/guides/auth/users |
| Redirect / Site URL allow list | https://supabase.com/docs/guides/auth/redirect-urls |
| Sessions, refresh, cookie vs SPA storage | https://supabase.com/docs/guides/auth/sessions |
| RLS grants, policies, anon vs authenticated | https://supabase.com/docs/guides/auth/row-level-security |
| Publishable/anon vs secret/service_role | https://supabase.com/docs/guides/api/api-keys |
| Disable signups (`enable_signup`) | https://supabase.com/docs/guides/local-development/cli/config |
| Production SMTP limits | https://supabase.com/docs/guides/auth/auth-smtp |
| SSR package (what *not* to require on static) | https://supabase.com/docs/guides/auth/server-side/nextjs |
| In-repo static config | `next.config.ts` (`output: "export"`, `trailingSlash`, `images.unoptimized`) |
| Domain language | `CONTEXT.md` |
| Sibling SSR reference (do not copy blindly) | https://github.com/Chapster87/cms-starter (`@supabase/ssr`, auth callback route) |
