# Supabase keepalive

The app's Supabase project (`ehyufwodmsysnyjagcmg`) is on the **Free plan**, which
Supabase pauses after **7 days of low database activity**
([Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)).
Because the app is a static export with a browser-only Supabase client, nothing
runs server-side to generate that activity on its own — a quiet week (no operator
sign-ins, no saves) can pause the project.

This runbook installs an **hourly DreamHost cron** that calls a tiny public RPC so
the project always sees database activity. Hourly leaves plenty of margin against
the 7-day window and costs nothing.

## How it works

`scripts/supabase-keepalive.sh` → `POST {SUPABASE_URL}/rest/v1/rpc/keepalive` with
the **anon key**. The RPC runs `select now()` in Postgres, so the request is real
database activity. Nothing about the app is exposed: the anon key is already
public (it ships in the browser bundle), and the RPC only returns a timestamp.

Why an RPC instead of pinging a table: the current schema gives `anon` no read
access to any table (the anonymous "Reviewer" read mode isn't built yet), so a
table ping would return 401 and may not register as activity. The RPC sidesteps
RLS entirely.

## One-time setup

### 1. Create the RPC (in the target project)

> The dev environment's Supabase tooling is currently pointed at a **different**
> project, so this step must be run by a human with access to
> `ehyufwodmsysnyjagcmg` — via the dashboard **SQL Editor**.

```sql
create or replace function public.keepalive()
returns timestamptz
language sql
security definer
set search_path = ''
as $$ select now(); $$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon;
```

### 2. The script deploys automatically

`scripts/supabase-keepalive.sh` is shipped to the server by the
`Deploy to DreamHost` workflow (`.github/workflows/deploy-dreamhost.yml`) on every
push to `main`; it lands at `~/bin/supabase-keepalive.sh`, mode 755. Commit the
script and let a deploy run — no manual copy needed.

To put it somewhere else, set the `DREAMHOST_REMOTE_BIN` repo secret (an absolute
path is recommended); the default is `bin`, relative to the login home dir. Keep
it in sync with the cron command in step 3.

Manual fallback, e.g. before the first deploy:

```sh
scp scripts/supabase-keepalive.sh USER@HOST:~/bin/
ssh USER@HOST 'chmod +x ~/bin/supabase-keepalive.sh'
```

Create the env file with the project URL and anon key, readable only by you:

```sh
# on the DreamHost shell
cat > ~/.supabase-keepalive.env <<'EOF'
SUPABASE_URL=https://ehyufwodmsysnyjagcmg.supabase.co
SUPABASE_ANON_KEY=PASTE_ANON_KEY_HERE
EOF
chmod 600 ~/.supabase-keepalive.env
```

### 3. Add the cron job

DreamHost panel → **Goodies → Cron Jobs** → add a custom job:

| Field    | Value                                          |
| -------- | ---------------------------------------------- |
| Command  | `/bin/sh /home/USER/bin/supabase-keepalive.sh` |
| Schedule | hourly (`0 * * * *`)                           |

Leave stdout/stderr unsuppressed. The script stays **silent on success** and only
writes to stderr on failure, so DreamHost's cron mail becomes an alert — you'll
get an email if a run ever fails.

## Verify

Run it once by hand:

```sh
ssh USER@HOST '~/bin/supabase-keepalive.sh; echo "exit=$?"'
```

- `exit=0` and a new `... OK 200` line in `~/supabase-keepalive.log` → working.
- Nothing on stdout is expected — confirmation lives in the log file.

You can also confirm from any machine with the same env values:

```sh
curl -sS -o /dev/null -w '%{http_code}\n' \
  -X POST "$SUPABASE_URL/rest/v1/rpc/keepalive" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" -d '{}'
```

Expect `200`.

## Troubleshooting

| Symptom        | Likely cause                                                         | Fix                                                                     |
| -------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `401` / `403`  | RPC missing, or `grant execute ... to anon` not applied              | Re-run the SQL in step 1                                                |
| `404`          | Function not in the exposed `public` schema, or wrong `SUPABASE_URL` | Check the URL and schema                                                |
| `540` or `503` | **Project is paused** — the keepalive lapsed                         | Resume it in the dashboard (90-day window), then check why cron stopped |
| `000`          | Network/DNS/curl failure                                             | Check the host's outbound access and `curl` availability                |
| No email ever  | Cron output suppressed, or DreamHost cron mail disabled              | Don't redirect output; check panel cron mail settings                   |

## Notes

- **Paused despite the cron?** Confirm the _target_ project ref matches
  `SUPABASE_URL`, and that the job is actually firing (check
  `~/supabase-keepalive.log` timestamps).
- **Changing the RPC or path:** override with `SUPABASE_KEEPALIVE_RPC` rather than
  editing the script.
- **Alternative to this whole setup:** upgrading to the Pro plan removes
  inactivity pausing entirely.
