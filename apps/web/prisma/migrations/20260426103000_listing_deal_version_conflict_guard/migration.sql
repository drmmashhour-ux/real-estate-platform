-- Optimistic concurrency for conflict-safe CRM / Dr. Brain automations (LECIPM).

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "deals" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
