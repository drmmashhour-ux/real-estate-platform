-- Mortgage expert professional verification (AMP / ID) + public routing gate
ALTER TABLE "mortgage_experts" ADD COLUMN "id_document_type" TEXT;
ALTER TABLE "mortgage_experts" ADD COLUMN "id_document_path" TEXT;
ALTER TABLE "mortgage_experts" ADD COLUMN "expert_verification_status" TEXT NOT NULL DEFAULT 'profile_incomplete';
ALTER TABLE "mortgage_experts" ADD COLUMN "amp_attested_at" TIMESTAMP(3);
ALTER TABLE "mortgage_experts" ADD COLUMN "profile_submitted_at" TIMESTAMP(3);

UPDATE "mortgage_experts"
SET "expert_verification_status" = 'verified'
WHERE "accepted_terms" = true;

CREATE INDEX "mortgage_experts_expert_verification_status_idx" ON "mortgage_experts"("expert_verification_status");
