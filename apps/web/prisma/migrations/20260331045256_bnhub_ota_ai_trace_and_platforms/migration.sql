-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BnhubChannelPlatform" ADD VALUE 'TRIVAGO';
ALTER TYPE "BnhubChannelPlatform" ADD VALUE 'HOTELS_COM';
ALTER TYPE "BnhubChannelPlatform" ADD VALUE 'GOOGLE_HOTEL';

-- CreateTable
CREATE TABLE "bnhub_ota_ai_traces" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "trace_type" VARCHAR(40) NOT NULL,
    "source_label" VARCHAR(80),
    "input_digest" VARCHAR(64) NOT NULL,
    "result_json" JSONB NOT NULL,
    "model" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_ota_ai_traces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bnhub_ota_ai_traces_user_id_created_at_idx" ON "bnhub_ota_ai_traces"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "bnhub_ota_ai_traces_listing_id_idx" ON "bnhub_ota_ai_traces"("listing_id");

-- AddForeignKey
ALTER TABLE "bnhub_ota_ai_traces" ADD CONSTRAINT "bnhub_ota_ai_traces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_ota_ai_traces" ADD CONSTRAINT "bnhub_ota_ai_traces_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
