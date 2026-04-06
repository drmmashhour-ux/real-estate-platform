-- AlterTable
ALTER TABLE "bnhub_listings" ADD COLUMN "legal_rent_right_attested_at" TIMESTAMP(3),
ADD COLUMN "legal_rent_right_attestation_version" TEXT;
