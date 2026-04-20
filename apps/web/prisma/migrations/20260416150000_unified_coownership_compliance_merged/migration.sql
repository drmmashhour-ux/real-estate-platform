-- Unified co-ownership + insurance checklist metadata and cached scores (LECIPM broker CRM)

CREATE TYPE "ChecklistItemCategory" AS ENUM ('COOWNERSHIP', 'INSURANCE');
CREATE TYPE "ChecklistPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TYPE "ComplianceChecklistItemStatus" ADD VALUE 'NOT_APPLICABLE';

ALTER TABLE "listing_coownership_checklist_items" ADD COLUMN "category" "ChecklistItemCategory" NOT NULL DEFAULT 'COOWNERSHIP';
ALTER TABLE "listing_coownership_checklist_items" ADD COLUMN "description" TEXT;
ALTER TABLE "listing_coownership_checklist_items" ADD COLUMN "priority" "ChecklistPriority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "listing_coownership_checklist_items" ADD COLUMN "source" VARCHAR(48);
ALTER TABLE "listing_coownership_checklist_items" ADD COLUMN "completed_at" TIMESTAMP(3);
ALTER TABLE "listing_coownership_checklist_items" ADD COLUMN "completed_by_user_id" TEXT;

ALTER TABLE "listing_coownership_checklist_items" ADD CONSTRAINT "listing_coownership_checklist_items_completed_by_user_id_fkey" FOREIGN KEY ("completed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Listing" ADD COLUMN "coownership_compliance_score_cache" INTEGER;
ALTER TABLE "Listing" ADD COLUMN "coownership_insurance_score_cache" INTEGER;

CREATE TABLE "listing_compliance_snapshots" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "compliance_percent" DOUBLE PRECISION,
    "insurance_percent" DOUBLE PRECISION,
    "overall_percent" DOUBLE PRECISION,
    "blocking_issues_json" JSONB,
    "recommendation_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_compliance_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listing_compliance_snapshots_listing_id_key" ON "listing_compliance_snapshots"("listing_id");

ALTER TABLE "listing_compliance_snapshots" ADD CONSTRAINT "listing_compliance_snapshots_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
