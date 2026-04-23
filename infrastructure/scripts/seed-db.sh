#!/usr/bin/env bash
# Seed database (run from repo root)
set -e
npm run db:seed --workspace=apps/web-app 2>/dev/null || echo "No seed script in web-app; add prisma/seed.ts"
