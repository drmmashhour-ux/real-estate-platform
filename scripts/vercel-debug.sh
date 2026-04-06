#!/bin/bash
set -e

# Vercel sets CI; avoids interactive pnpm prompts (e.g. modules purge confirm).
export CI="${CI:-1}"

echo "=== ENV CHECK ==="
node -v
pnpm -v

echo "=== INSTALL ==="
pnpm install --no-frozen-lockfile

echo "=== PRISMA GENERATE ==="
pnpm --filter @lecipm/web exec prisma generate

echo "=== CLEAR STALE NEXT LOCK (if any) ==="
rm -f apps/web/.next/lock || true

echo "=== BUILD ==="
pnpm --filter @lecipm/web build

echo "=== DONE (no errors above) ==="
