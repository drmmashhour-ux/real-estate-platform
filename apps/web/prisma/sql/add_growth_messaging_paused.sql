-- Idempotent: safe if migration history is not applied (e.g. baselined DBs).
-- Matches apps/web/prisma/migrations/20260328120000_growth_messaging_templates/migration.sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "growth_messaging_paused" BOOLEAN NOT NULL DEFAULT false;
