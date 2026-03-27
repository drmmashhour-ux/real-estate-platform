#!/usr/bin/env bash
# Quick local Postgres setup for LECIPM web (apps/web).
# - Does not print DATABASE_URL value after writing.
# - Requires: PostgreSQL running locally, createdb/psql/pg_isready on PATH.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/apps/web/.env"
DB_NAME="${LOCAL_DB_NAME:-lecipm_dev}"
PG_HOST="${PGHOST:-127.0.0.1}"
PG_PORT="${PGPORT:-5432}"
NEW_URL="${LOCAL_DATABASE_URL:-postgresql://127.0.0.1:${PG_PORT}/${DB_NAME}}"

echo "[setup-local-db] Repo root: ${ROOT}"
echo "[setup-local-db] Target database: ${DB_NAME} on ${PG_HOST}:${PG_PORT}"

if ! command -v pg_isready >/dev/null 2>&1; then
  echo "[setup-local-db] ERROR: pg_isready not found. Install PostgreSQL client tools."
  exit 1
fi

if ! pg_isready -h "$PG_HOST" -p "$PG_PORT" >/dev/null 2>&1; then
  echo "[setup-local-db] ERROR: PostgreSQL is not accepting connections at ${PG_HOST}:${PG_PORT}"
  exit 1
fi

if psql -h "$PG_HOST" -p "$PG_PORT" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  echo "[setup-local-db] Database '${DB_NAME}' already exists."
else
  echo "[setup-local-db] Creating database '${DB_NAME}'…"
  psql -h "$PG_HOST" -p "$PG_PORT" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${DB_NAME}\";"
fi

echo "[setup-local-db] Updating apps/web/.env (DATABASE_URL only; value not printed)…"
python3 - "$ENV_FILE" "$NEW_URL" << 'PY'
import re
import sys
from pathlib import Path

env_path = Path(sys.argv[1])
new_url = sys.argv[2]
text = env_path.read_text(encoding="utf-8") if env_path.exists() else ""
pattern = re.compile(r"^DATABASE_URL\s*=.*$", re.MULTILINE)
replacement = f'DATABASE_URL="{new_url}"'
if pattern.search(text):
    text = pattern.sub(replacement, text, count=1)
else:
    if text and not text.endswith("\n"):
        text += "\n"
    text += replacement + "\n"
env_path.parent.mkdir(parents=True, exist_ok=True)
env_path.write_text(text, encoding="utf-8")
print("[setup-local-db] DATABASE_URL written to apps/web/.env (value omitted).")
PY

echo "[setup-local-db] Running prisma migrate reset + seed…"
cd "$ROOT"
unset DATABASE_URL
npx tsx scripts/prisma-destructive-guard.ts migrate-reset
pnpm --filter @lecipm/web exec prisma migrate reset --force
pnpm db:seed

echo "[setup-local-db] Done. Run: pnpm db:check && pnpm dev"
