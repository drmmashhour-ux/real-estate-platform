-- BNHub growth engine: production hardening (prefs, publish guards, lead quality fields, RLS fixes)

CREATE TABLE "bnhub_host_growth_prefs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "max_autonomy_level" "BnhubGrowthAutonomyLevel" NOT NULL DEFAULT 'ASSISTED',
    "daily_spend_cap_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_host_growth_prefs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_host_growth_prefs_user_id_key" ON "bnhub_host_growth_prefs"("user_id");

ALTER TABLE "bnhub_host_growth_prefs" ADD CONSTRAINT "bnhub_host_growth_prefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bnhub_growth_distributions" ADD COLUMN "publish_attempt_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bnhub_growth_distributions" ADD COLUMN "publish_locked_until" TIMESTAMP(3);
ALTER TABLE "bnhub_growth_distributions" ADD COLUMN "last_publish_error" TEXT;

CREATE INDEX "bnhub_growth_distributions_publish_locked_until_idx" ON "bnhub_growth_distributions"("publish_locked_until");

ALTER TABLE "bnhub_leads" ADD COLUMN "spam_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bnhub_leads" ADD COLUMN "spam_reasons_json" JSONB;
ALTER TABLE "bnhub_leads" ADD COLUMN "response_due_at" TIMESTAMP(3);
ALTER TABLE "bnhub_leads" ADD COLUMN "first_response_at" TIMESTAMP(3);
ALTER TABLE "bnhub_leads" ADD COLUMN "converted_at" TIMESTAMP(3);
ALTER TABLE "bnhub_leads" ADD COLUMN "dedupe_key" TEXT;

CREATE INDEX "bnhub_leads_dedupe_key_idx" ON "bnhub_leads"("dedupe_key");
CREATE INDEX "bnhub_leads_response_due_at_idx" ON "bnhub_leads"("response_due_at");

-- Leads: allow listing owner (host_id) even when host_user_id on lead is unset
DROP POLICY IF EXISTS "bnhub_leads_rw_scope" ON "bnhub_leads";
CREATE POLICY "bnhub_leads_rw_scope" ON "bnhub_leads"
  FOR ALL TO authenticated
  USING (
    public.is_platform_admin_uid()
    OR host_user_id = (auth.uid())::text
    OR owner_user_id = (auth.uid())::text
    OR (
      listing_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM "bnhub_listings" s
        WHERE s.id = listing_id AND s.host_id = (auth.uid())::text
      )
    )
  )
  WITH CHECK (
    public.is_platform_admin_uid()
    OR host_user_id = (auth.uid())::text
    OR owner_user_id = (auth.uid())::text
    OR (
      listing_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM "bnhub_listings" s
        WHERE s.id = listing_id AND s.host_id = (auth.uid())::text
      )
    )
  );

DROP POLICY IF EXISTS "bnhub_lead_events_rw_scope" ON "bnhub_lead_events";
CREATE POLICY "bnhub_lead_events_rw_scope" ON "bnhub_lead_events"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "bnhub_leads" l
      WHERE l.id = lead_id AND (
        public.is_platform_admin_uid()
        OR l.host_user_id = (auth.uid())::text
        OR l.owner_user_id = (auth.uid())::text
        OR (
          l.listing_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM "bnhub_listings" s
            WHERE s.id = l.listing_id AND s.host_id = (auth.uid())::text
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "bnhub_leads" l
      WHERE l.id = lead_id AND (
        public.is_platform_admin_uid()
        OR l.host_user_id = (auth.uid())::text
        OR l.owner_user_id = (auth.uid())::text
        OR (
          l.listing_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM "bnhub_listings" s
            WHERE s.id = l.listing_id AND s.host_id = (auth.uid())::text
          )
        )
      )
    )
  );

ALTER TABLE "bnhub_host_growth_prefs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bnhub_host_growth_prefs_own" ON "bnhub_host_growth_prefs"
  FOR ALL TO authenticated
  USING (user_id = (auth.uid())::text OR public.is_platform_admin_uid())
  WITH CHECK (user_id = (auth.uid())::text OR public.is_platform_admin_uid());
