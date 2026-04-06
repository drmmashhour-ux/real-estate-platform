#!/bin/bash
set -e

export CI="${CI:-1}"

echo "=== ENV CHECK ==="
node -v
pnpm -v

echo "=== INSTALL ==="
pnpm install --no-frozen-lockfile

echo "=== PRISMA GENERATE ==="
pnpm --filter @lecipm/web exec prisma generate

echo "=== BUILD ==="
pnpm --filter @lecipm/web build
