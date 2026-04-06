-- Seller Declaration AI drafts + AI audit events
DO $$ BEGIN
  CREATE TYPE "SellerDeclarationDraftStatus" AS ENUM ('draft', 'in_review', 'needs_changes', 'ready', 'finalized');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "seller_declaration_drafts" (
  "id" TEXT PRIMARY KEY,
  "listing_id" TEXT NOT NULL,
  "seller_user_id" TEXT,
  "admin_user_id" TEXT,
  "status" "SellerDeclarationDraftStatus" NOT NULL DEFAULT 'draft',
  "draft_payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "validation_summary" JSONB,
  "ai_summary" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "seller_declaration_drafts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE,
  CONSTRAINT "seller_declaration_drafts_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "seller_declaration_drafts_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "seller_declaration_drafts_listing_id_idx" ON "seller_declaration_drafts"("listing_id");
CREATE INDEX IF NOT EXISTS "seller_declaration_drafts_seller_user_id_idx" ON "seller_declaration_drafts"("seller_user_id");
CREATE INDEX IF NOT EXISTS "seller_declaration_drafts_admin_user_id_idx" ON "seller_declaration_drafts"("admin_user_id");
CREATE INDEX IF NOT EXISTS "seller_declaration_drafts_status_idx" ON "seller_declaration_drafts"("status");

CREATE TABLE IF NOT EXISTS "seller_declaration_ai_events" (
  "id" TEXT PRIMARY KEY,
  "draft_id" TEXT NOT NULL,
  "section_key" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "prompt_context" JSONB NOT NULL,
  "output" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "seller_declaration_ai_events_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "seller_declaration_ai_events_draft_id_idx" ON "seller_declaration_ai_events"("draft_id");
CREATE INDEX IF NOT EXISTS "seller_declaration_ai_events_section_key_idx" ON "seller_declaration_ai_events"("section_key");
CREATE INDEX IF NOT EXISTS "seller_declaration_ai_events_action_type_idx" ON "seller_declaration_ai_events"("action_type");
