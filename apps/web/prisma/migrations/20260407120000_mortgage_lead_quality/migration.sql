-- Qualification + intent scoring for mortgage leads
ALTER TABLE "mortgage_requests" ADD COLUMN "intent_level" TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE "mortgage_requests" ADD COLUMN "timeline" TEXT NOT NULL DEFAULT '1-3 months';
ALTER TABLE "mortgage_requests" ADD COLUMN "pre_approved" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "mortgage_requests_intent_level_idx" ON "mortgage_requests"("intent_level");
