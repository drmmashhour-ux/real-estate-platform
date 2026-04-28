-- ORDER SYBNB-93 — anonymous public posting metadata.

ALTER TABLE "syria_properties"
ADD COLUMN IF NOT EXISTS "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "posting_kind" TEXT;
