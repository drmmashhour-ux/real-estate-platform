-- AlterTable
ALTER TABLE "mortgage_brokers" ADD COLUMN "id_document_url" TEXT;
ALTER TABLE "mortgage_brokers" ADD COLUMN "selfie_photo_url" TEXT;
ALTER TABLE "mortgage_brokers" ADD COLUMN "identity_status" TEXT NOT NULL DEFAULT 'pending';

-- Existing license-verified brokers: treat identity as verified so dashboard access is unchanged.
UPDATE "mortgage_brokers"
SET "identity_status" = 'verified'
WHERE "verification_status" = 'verified';
