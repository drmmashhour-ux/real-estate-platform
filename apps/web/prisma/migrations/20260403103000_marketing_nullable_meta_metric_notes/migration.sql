-- Align marketing_content metadata with optional fields; manual metric notes

ALTER TABLE "marketing_content" ALTER COLUMN "topic" DROP NOT NULL;
ALTER TABLE "marketing_content" ALTER COLUMN "tone" DROP NOT NULL;
ALTER TABLE "marketing_content" ALTER COLUMN "audience" DROP NOT NULL;

ALTER TABLE "marketing_metrics" ADD COLUMN "notes" TEXT;
