#!/bin/sh
#
# Supabase keepalive — keeps the free-tier project off the 7-day inactivity
# pause. Calls the public `keepalive()` RPC with the (public) anon key, logs the
# result, and exits non-zero on anything other than 2xx so cron can email the
# owner. See docs/ops/supabase-keepalive.md for setup.
#
# Config comes from an env file (default ~/.supabase-keepalive.env):
#   SUPABASE_URL=https://<project-ref>.supabase.co
#   SUPABASE_ANON_KEY=...
#
# Optional overrides:
#   SUPABASE_KEEPALIVE_ENV   path to the env file
#   SUPABASE_KEEPALIVE_LOG   path to the log file (default ~/supabase-keepalive.log)
#   SUPABASE_KEEPALIVE_RPC   RPC name (default "keepalive")

set -eu

ENV_FILE="${SUPABASE_KEEPALIVE_ENV:-$HOME/.supabase-keepalive.env}"
LOG_FILE="${SUPABASE_KEEPALIVE_LOG:-$HOME/supabase-keepalive.log}"
RPC="${SUPABASE_KEEPALIVE_RPC:-keepalive}"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi

: "${SUPABASE_URL:?SUPABASE_URL is not set (looked in $ENV_FILE)}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is not set (looked in $ENV_FILE)}"

STAMP="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
BODY="$(mktemp)"
trap 'rm -f "$BODY"' EXIT

if CODE="$(curl -sS --max-time 20 -o "$BODY" -w '%{http_code}' \
  -X POST "$SUPABASE_URL/rest/v1/rpc/$RPC" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')"; then
  :
else
  # curl itself failed (DNS, timeout, connection refused) — no HTTP code.
  CODE="000"
fi

case "$CODE" in
  2*)
    printf '%s OK %s\n' "$STAMP" "$CODE" >> "$LOG_FILE"
    ;;
  *)
    DETAIL="$(head -c 300 "$BODY" | tr '\n' ' ')"
    printf '%s FAIL %s %s\n' "$STAMP" "$CODE" "$DETAIL" >> "$LOG_FILE"
    # Emit to stderr so the cron run emails the owner; successful runs stay quiet.
    echo "supabase-keepalive FAILED: HTTP $CODE" >&2
    [ -n "$DETAIL" ] && echo "$DETAIL" >&2
    exit 1
    ;;
esac
