-- AlterTable
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "availability" TEXT[] DEFAULT ARRAY[]::TEXT[];
