-- Extend notaries, deal notary coordination, signature sessions for production integrations
ALTER TABLE "notaries" ADD COLUMN IF NOT EXISTS "region" VARCHAR(64);
ALTER TABLE "notaries" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(32);
ALTER TABLE "notaries" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "notaries" ADD COLUMN IF NOT EXISTS "license_number" VARCHAR(64);
ALTER TABLE "notaries" ADD COLUMN IF NOT EXISTS "languages_json" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "notaries" ADD COLUMN IF NOT EXISTS "availability_json" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "notaries" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "notaries_region_idx" ON "notaries"("region");

ALTER TABLE "deal_notary_coordinations" ADD COLUMN IF NOT EXISTS "notary_id" TEXT;
ALTER TABLE "deal_notary_coordinations" ADD COLUMN IF NOT EXISTS "selected_at" TIMESTAMP(3);
ALTER TABLE "deal_notary_coordinations" ADD COLUMN IF NOT EXISTS "invitation_sent_at" TIMESTAMP(3);
ALTER TABLE "deal_notary_coordinations" ADD COLUMN IF NOT EXISTS "notary_invite_status" VARCHAR(24);

CREATE INDEX IF NOT EXISTS "deal_notary_coordinations_notary_id_idx" ON "deal_notary_coordinations"("notary_id");

ALTER TABLE "deal_notary_coordinations" ADD CONSTRAINT "deal_notary_coordinations_notary_id_fkey" FOREIGN KEY ("notary_id") REFERENCES "notaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "signature_sessions" ADD COLUMN IF NOT EXISTS "provider_metadata" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "signature_participants" ADD COLUMN IF NOT EXISTS "provider_recipient_id" VARCHAR(128);
