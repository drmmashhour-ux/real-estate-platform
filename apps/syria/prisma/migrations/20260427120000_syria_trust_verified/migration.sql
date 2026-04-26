-- SY-11: trust system — marketplace `verified` flag
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;
