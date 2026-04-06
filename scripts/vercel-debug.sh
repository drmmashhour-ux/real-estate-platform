#!/bin/bash

echo "=== ENV CHECK ==="
node -v
pnpm -v

echo "=== INSTALL ==="
pnpm install --no-frozen-lockfile || exit 1

echo "=== PRISMA GENERATE ==="
pnpm --filter @lecipm/web exec prisma generate || echo "Prisma generate failed"

echo "=== BUILD ==="
pnpm --filter @lecipm/web build
