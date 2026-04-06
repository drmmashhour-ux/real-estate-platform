-- BNHub: classification extensions, luxury tiers, trust/fraud, dynamic pricing, audit, host quality
-- RLS: authenticated hosts (listing owner) + platform admin; fraud/evidence admin-only.

-- A) Extend property classification
ALTER TABLE "bnhub_property_classification" ADD COLUMN IF NOT EXISTS "rating_label" TEXT;
ALTER TABLE "bnhub_property_classification" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Enums
CREATE TYPE "BnhubLuxuryTierCode" AS ENUM ('NONE', 'VERIFIED', 'PREMIUM', 'ELITE');
CREATE TYPE "BnhubLuxuryEligibilityStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE', 'REVIEW_REQUIRED', 'SUSPENDED');
CREATE TYPE "BnhubTrustRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "BnhubTrustProfileStatus" AS ENUM ('TRUSTED', 'REVIEW_REQUIRED', 'RESTRICTED', 'BLOCKED');
CREATE TYPE "BnhubFraudFlagType" AS ENUM (
  'ADDRESS_MISMATCH',
  'SUSPICIOUS_PRICE',
  'DUPLICATE_LISTING',
  'MISSING_EXTERIOR_PHOTO',
  'SUSPICIOUS_IMAGES',
  'REPEATED_CONTACT_PATTERN',
  'UNVERIFIABLE_HOST',
  'INCONSISTENT_METADATA',
  'ABNORMAL_BEHAVIOR',
  'MANUAL_REVIEW'
);
CREATE TYPE "BnhubFraudSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "BnhubFraudFlagStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED');
CREATE TYPE "BnhubPricingScopeType" AS ENUM ('GLOBAL', 'CITY', 'LISTING', 'HOST');
CREATE TYPE "BnhubPricingRuleType" AS ENUM (
  'WEEKEND_MULTIPLIER',
  'OCCUPANCY_DEMAND',
  'MIN_GUARDRAIL',
  'MAX_GUARDRAIL',
  'PREMIUM_BONUS',
  'EVENT_BONUS',
  'SEASONAL_SHIFT',
  'TRUST_PENALTY',
  'FRAUD_LOCK'
);
CREATE TYPE "BnhubPricingHistorySource" AS ENUM ('SYSTEM', 'AI', 'ADMIN', 'HOST');

-- Engine audit (trust / tier / pricing / fraud actions)
CREATE TABLE "bnhub_engine_audit_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "host_user_id" TEXT,
    "decision_type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_engine_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_engine_audit_logs_listing_id_idx" ON "bnhub_engine_audit_logs"("listing_id");
CREATE INDEX "bnhub_engine_audit_logs_host_user_id_idx" ON "bnhub_engine_audit_logs"("host_user_id");
CREATE INDEX "bnhub_engine_audit_logs_decision_type_idx" ON "bnhub_engine_audit_logs"("decision_type");
CREATE INDEX "bnhub_engine_audit_logs_created_at_idx" ON "bnhub_engine_audit_logs"("created_at");

-- Luxury tiers
CREATE TABLE "bnhub_luxury_tiers" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "tier_code" "BnhubLuxuryTierCode" NOT NULL DEFAULT 'NONE',
    "tier_score" INTEGER NOT NULL DEFAULT 0,
    "eligibility_status" "BnhubLuxuryEligibilityStatus" NOT NULL DEFAULT 'INELIGIBLE',
    "trust_component_score" INTEGER NOT NULL DEFAULT 0,
    "quality_component_score" INTEGER NOT NULL DEFAULT 0,
    "responsiveness_component_score" INTEGER NOT NULL DEFAULT 0,
    "hospitality_component_score" INTEGER NOT NULL DEFAULT 0,
    "visual_component_score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "breakdown_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_luxury_tiers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_luxury_tiers_listing_id_key" ON "bnhub_luxury_tiers"("listing_id");
CREATE INDEX "bnhub_luxury_tiers_listing_id_idx" ON "bnhub_luxury_tiers"("listing_id");
CREATE INDEX "bnhub_luxury_tiers_tier_code_idx" ON "bnhub_luxury_tiers"("tier_code");
CREATE INDEX "bnhub_luxury_tiers_eligibility_status_idx" ON "bnhub_luxury_tiers"("eligibility_status");
CREATE INDEX "bnhub_luxury_tiers_computed_at_idx" ON "bnhub_luxury_tiers"("computed_at");
ALTER TABLE "bnhub_luxury_tiers" ADD CONSTRAINT "bnhub_luxury_tiers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Trust profiles
CREATE TABLE "bnhub_trust_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "verification_score" INTEGER NOT NULL DEFAULT 0,
    "documentation_score" INTEGER NOT NULL DEFAULT 0,
    "listing_consistency_score" INTEGER NOT NULL DEFAULT 0,
    "photo_authenticity_score" INTEGER NOT NULL DEFAULT 0,
    "pricing_sanity_score" INTEGER NOT NULL DEFAULT 0,
    "duplication_risk_score" INTEGER NOT NULL DEFAULT 0,
    "behavior_risk_score" INTEGER NOT NULL DEFAULT 0,
    "overall_risk_level" "BnhubTrustRiskLevel" NOT NULL DEFAULT 'LOW',
    "status" "BnhubTrustProfileStatus" NOT NULL DEFAULT 'TRUSTED',
    "flags_json" JSONB,
    "recommendations_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_trust_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_trust_profiles_listing_id_key" ON "bnhub_trust_profiles"("listing_id");
CREATE INDEX "bnhub_trust_profiles_listing_id_idx" ON "bnhub_trust_profiles"("listing_id");
CREATE INDEX "bnhub_trust_profiles_host_user_id_idx" ON "bnhub_trust_profiles"("host_user_id");
CREATE INDEX "bnhub_trust_profiles_overall_risk_level_idx" ON "bnhub_trust_profiles"("overall_risk_level");
CREATE INDEX "bnhub_trust_profiles_status_idx" ON "bnhub_trust_profiles"("status");
CREATE INDEX "bnhub_trust_profiles_computed_at_idx" ON "bnhub_trust_profiles"("computed_at");
ALTER TABLE "bnhub_trust_profiles" ADD CONSTRAINT "bnhub_trust_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_trust_profiles" ADD CONSTRAINT "bnhub_trust_profiles_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fraud flags (admin-only via RLS; app surfaces safe copy to hosts)
CREATE TABLE "bnhub_fraud_flags" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "host_user_id" TEXT,
    "flag_type" "BnhubFraudFlagType" NOT NULL,
    "severity" "BnhubFraudSeverity" NOT NULL DEFAULT 'LOW',
    "status" "BnhubFraudFlagStatus" NOT NULL DEFAULT 'OPEN',
    "auto_generated" BOOLEAN NOT NULL DEFAULT true,
    "summary" TEXT NOT NULL,
    "evidence_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_fraud_flags_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_fraud_flags_listing_id_idx" ON "bnhub_fraud_flags"("listing_id");
CREATE INDEX "bnhub_fraud_flags_host_user_id_idx" ON "bnhub_fraud_flags"("host_user_id");
CREATE INDEX "bnhub_fraud_flags_flag_type_idx" ON "bnhub_fraud_flags"("flag_type");
CREATE INDEX "bnhub_fraud_flags_severity_idx" ON "bnhub_fraud_flags"("severity");
CREATE INDEX "bnhub_fraud_flags_status_idx" ON "bnhub_fraud_flags"("status");
CREATE INDEX "bnhub_fraud_flags_created_at_idx" ON "bnhub_fraud_flags"("created_at");
ALTER TABLE "bnhub_fraud_flags" ADD CONSTRAINT "bnhub_fraud_flags_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_fraud_flags" ADD CONSTRAINT "bnhub_fraud_flags_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Dynamic pricing profiles
CREATE TABLE "bnhub_dynamic_pricing_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "recommended_price" DECIMAL(12,2) NOT NULL,
    "min_price" DECIMAL(12,2) NOT NULL,
    "max_price" DECIMAL(12,2) NOT NULL,
    "weekday_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "weekend_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "seasonal_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "demand_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "quality_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "luxury_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "trust_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "market_adjustment" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "confidence_score" INTEGER NOT NULL DEFAULT 0,
    "explanation_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_dynamic_pricing_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_dynamic_pricing_profiles_listing_id_key" ON "bnhub_dynamic_pricing_profiles"("listing_id");
CREATE INDEX "bnhub_dynamic_pricing_profiles_listing_id_idx" ON "bnhub_dynamic_pricing_profiles"("listing_id");
CREATE INDEX "bnhub_dynamic_pricing_profiles_computed_at_idx" ON "bnhub_dynamic_pricing_profiles"("computed_at");
ALTER TABLE "bnhub_dynamic_pricing_profiles" ADD CONSTRAINT "bnhub_dynamic_pricing_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Pricing rules
CREATE TABLE "bnhub_pricing_rules" (
    "id" TEXT NOT NULL,
    "scope_type" "BnhubPricingScopeType" NOT NULL,
    "scope_id" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rule_name" TEXT NOT NULL,
    "rule_type" "BnhubPricingRuleType" NOT NULL,
    "conditions_json" JSONB,
    "actions_json" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_pricing_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_pricing_rules_scope_type_scope_id_idx" ON "bnhub_pricing_rules"("scope_type", "scope_id");
CREATE INDEX "bnhub_pricing_rules_is_enabled_idx" ON "bnhub_pricing_rules"("is_enabled");
CREATE INDEX "bnhub_pricing_rules_rule_type_idx" ON "bnhub_pricing_rules"("rule_type");
CREATE INDEX "bnhub_pricing_rules_priority_idx" ON "bnhub_pricing_rules"("priority");

-- Pricing history
CREATE TABLE "bnhub_pricing_history" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "previous_price" DECIMAL(12,2) NOT NULL,
    "recommended_price" DECIMAL(12,2) NOT NULL,
    "applied_price" DECIMAL(12,2),
    "reason_summary" TEXT NOT NULL,
    "factors_json" JSONB,
    "source_type" "BnhubPricingHistorySource" NOT NULL DEFAULT 'SYSTEM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_pricing_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_pricing_history_listing_id_idx" ON "bnhub_pricing_history"("listing_id");
CREATE INDEX "bnhub_pricing_history_created_at_idx" ON "bnhub_pricing_history"("created_at");
ALTER TABLE "bnhub_pricing_history" ADD CONSTRAINT "bnhub_pricing_history_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Host quality (responsiveness / host-level signals)
CREATE TABLE "bnhub_host_quality_profiles" (
    "id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "responsiveness_score" INTEGER NOT NULL DEFAULT 50,
    "cancellation_rate_bps" INTEGER NOT NULL DEFAULT 0,
    "message_rate_score" INTEGER NOT NULL DEFAULT 50,
    "breakdown_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_host_quality_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_host_quality_profiles_host_user_id_key" ON "bnhub_host_quality_profiles"("host_user_id");
CREATE INDEX "bnhub_host_quality_profiles_host_user_id_idx" ON "bnhub_host_quality_profiles"("host_user_id");

ALTER TABLE "bnhub_host_quality_profiles" ADD CONSTRAINT "bnhub_host_quality_profiles_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE "bnhub_property_classification" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bnhub_property_classification_select_host_admin" ON "bnhub_property_classification";
CREATE POLICY "bnhub_property_classification_select_host_admin" ON "bnhub_property_classification"
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin_uid()
    OR EXISTS (
      SELECT 1 FROM "bnhub_listings" l
      WHERE l.id = listing_id AND l.host_id = (auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "bnhub_property_classification_write_admin" ON "bnhub_property_classification";
CREATE POLICY "bnhub_property_classification_write_admin" ON "bnhub_property_classification"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_luxury_tiers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_luxury_tiers_select_host_admin" ON "bnhub_luxury_tiers"
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin_uid()
    OR EXISTS (SELECT 1 FROM "bnhub_listings" l WHERE l.id = listing_id AND l.host_id = (auth.uid())::text)
  );
CREATE POLICY "bnhub_luxury_tiers_write_admin" ON "bnhub_luxury_tiers"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_trust_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_trust_profiles_select_host_admin" ON "bnhub_trust_profiles"
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin_uid()
    OR EXISTS (SELECT 1 FROM "bnhub_listings" l WHERE l.id = listing_id AND l.host_id = (auth.uid())::text)
  );
CREATE POLICY "bnhub_trust_profiles_write_admin" ON "bnhub_trust_profiles"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_fraud_flags" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_fraud_flags_admin_only" ON "bnhub_fraud_flags"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_dynamic_pricing_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_dpp_select_host_admin" ON "bnhub_dynamic_pricing_profiles"
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin_uid()
    OR EXISTS (SELECT 1 FROM "bnhub_listings" l WHERE l.id = listing_id AND l.host_id = (auth.uid())::text)
  );
CREATE POLICY "bnhub_dpp_write_admin" ON "bnhub_dynamic_pricing_profiles"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_pricing_rules" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_pricing_rules_admin" ON "bnhub_pricing_rules"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_pricing_history" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_ph_select_host_admin" ON "bnhub_pricing_history"
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin_uid()
    OR EXISTS (SELECT 1 FROM "bnhub_listings" l WHERE l.id = listing_id AND l.host_id = (auth.uid())::text)
  );
CREATE POLICY "bnhub_ph_write_admin" ON "bnhub_pricing_history"
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin_uid());

ALTER TABLE "bnhub_host_quality_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_hqp_own_admin" ON "bnhub_host_quality_profiles"
  FOR ALL TO authenticated
  USING (host_user_id = (auth.uid())::text OR public.is_platform_admin_uid())
  WITH CHECK (host_user_id = (auth.uid())::text OR public.is_platform_admin_uid());

ALTER TABLE "bnhub_engine_audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bnhub_engine_audit_admin" ON "bnhub_engine_audit_logs"
  FOR ALL TO authenticated
  USING (public.is_platform_admin_uid())
  WITH CHECK (public.is_platform_admin_uid());
