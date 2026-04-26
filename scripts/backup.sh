#!/usr/bin/env bash
# PostgreSQL logical backup (plain SQL). Schedule e.g. cron:
#   0 3 * * * cd /path/to/real-estate-platform && ./scripts/backup.sh >> /var/log/lecipm-backup.log 2>&1
# Requires: pg_dump on PATH, DATABASE_URL in environment (load from .env before cron if needed).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${BACKUP_DIR:-${ROOT}/backups}"
mkdir -p "$OUT_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[backup] ERROR: DATABASE_URL is not set."
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "[backup] ERROR: pg_dump not found. Install PostgreSQL client tools."
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="${OUT_DIR}/backup-${STAMP}.sql"

echo "[backup] Writing ${FILE}"
pg_dump "$DATABASE_URL" > "$FILE"
echo "[backup] OK (${FILE})"
