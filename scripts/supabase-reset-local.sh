#!/usr/bin/env bash
set -euo pipefail

# Reset local Supabase DB and re-apply migrations + seed.
# Usage: ./scripts/supabase-reset-local.sh

if ! command -v supabase >/dev/null 2>&1; then
  echo "error: supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

echo "→ Ensuring local stack is running..."
supabase start >/dev/null

echo "→ Resetting database and applying migrations..."
supabase db reset --local

echo
echo "Done."
echo "  Studio:  http://localhost:54323"
echo "  DB URL:  postgresql://postgres:postgres@localhost:54322/postgres"
echo "  API URL: http://localhost:54321"
