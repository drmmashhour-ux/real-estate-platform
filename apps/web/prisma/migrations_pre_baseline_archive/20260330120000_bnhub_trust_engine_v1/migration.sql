-- BNHub Trust Engine: identity, address, media, listing risk, risk flags v2, location policy, restricted zone columns, identity audit

CREATE TYPE "BnhubTrustIdentityUserRole" AS ENUM ('HOST', 'GUEST', 'ADMIN', 'SERVICE_PROVIDER');
CREATE TYPE "BnhubTrustIdentityProvider" AS ENUM ('STRIPE_IDENTITY', 'MANUAL', 'OTHER');
CREATE TYPE "BnhubTrustIdentitySessionStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'REQUIRES_INPUT', 'VERIFIED', 'FAILED', 'RESTRICTED');
CREATE TYPE "BnhubTrustGeocodeProvider" AS ENUM ('GOOGLE_GEOCODING', 'MANUAL', 'OTHER');
CREATE TYPE "BnhubTrustGeocodeStatus" AS ENUM ('PENDING', 'SUCCESS', 'PARTIAL_MATCH', 'FAILED', 'NEEDS_REVIEW');
CREATE TYPE "BnhubTrustStreetviewCompareStatus" AS ENUM ('NOT_RUN', 'PENDING', 'MATCHED', 'WEAK_MATCH', 'NO_REFERENCE', 'FAILED', 'REVIEW_REQUIRED');
CREATE TYPE "BnhubTrustPayoutGateStatus" AS ENUM ('NONE', 'HOLD', 'RELEASE_BLOCKED');
CREATE TYPE "BnhubTrustPromotionGateStatus" AS ENUM ('ELIGIBLE', 'REVIEW_REQUIRED', 'BLOCKED');
CREATE TYPE "BnhubTrustRiskFlagTypeV2" AS ENUM (
  'IDENTITY_INCOMPLETE', 'ADDRESS_MISMATCH', 'SUSPICIOUS_PRICE', 'DUPLICATE_LISTING', 'REPEATED_MEDIA',
  'MISSING_EXTERIOR_PHOTO', 'UNVERIFIABLE_LOCATION', 'ABNORMAL_BEHAVIOR', 'MANUAL_REVIEW', 'RESTRICTED_ZONE', 'PAYMENT_RISK'
);
CREATE TYPE "BnhubTrustRiskFlagVisibility" AS ENUM ('ADMIN_ONLY', 'SAFE_HOST_VISIBLE');
CREATE TYPE "BnhubTrustLocationPolicyStatus" AS ENUM ('PENDING', 'APPROVED', 'MANUAL_REVIEW_REQUIRED', 'RESTRICTED', 'REJECTED');
CREATE TYPE "BnhubTrustZonePolicyResult" AS ENUM ('CLEAR', 'REVIEW_REQUIRED', 'RESTRICTED_ZONE', 'UNKNOWN');
CREATE TYPE "BnhubTrustAccessSafetyResult" AS ENUM ('CLEAR', 'REVIEW_REQUIRED', 'RESTRICTED');
CREATE TYPE "BnhubTrustRestrictedZoneAction" AS ENUM ('REVIEW_REQUIRED', 'RESTRICTED', 'REJECTED');
CREATE TYPE "BnhubTrustIdentityAuditActor" AS ENUM ('SYSTEM', 'AI', 'ADMIN', 'WEBHOOK', 'HOST');

ALTER TABLE "bnhub_restricted_zones" ADD COLUMN IF NOT EXISTS "postal_code" TEXT;
ALTER TABLE "bnhub_restricted_zones" ADD COLUMN IF NOT EXISTS "region_code" TEXT;
ALTER TABLE "bnhub_restricted_zones" ADD COLUMN IF NOT EXISTS "policy_action" "BnhubTrustRestrictedZoneAction";

CREATE INDEX IF NOT EXISTS "bnhub_restricted_zones_postal_code_idx" ON "bnhub_restricted_zones"("postal_code");
CREATE INDEX IF NOT EXISTS "bnhub_restricted_zones_region_code_idx" ON "bnhub_restricted_zones"("region_code");

CREATE TABLE "bnhub_identity_verifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_role" "BnhubTrustIdentityUserRole" NOT NULL,
    "provider" "BnhubTrustIdentityProvider" NOT NULL,
    "verification_session_id" TEXT,
    "verification_status" "BnhubTrustIdentitySessionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "document_type" TEXT,
    "country_code" TEXT,
    "result_summary" TEXT,
    "provider_payload_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_identity_verifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_identity_verifications_user_id_idx" ON "bnhub_identity_verifications"("user_id");
CREATE INDEX "bnhub_identity_verifications_verification_status_idx" ON "bnhub_identity_verifications"("verification_status");
CREATE INDEX "bnhub_identity_verifications_provider_idx" ON "bnhub_identity_verifications"("provider");
ALTER TABLE "bnhub_identity_verifications" ADD CONSTRAINT "bnhub_identity_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_address_verifications" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "raw_address" TEXT NOT NULL,
    "normalized_address" TEXT,
    "geocode_provider" "BnhubTrustGeocodeProvider" NOT NULL,
    "geocode_status" "BnhubTrustGeocodeStatus" NOT NULL DEFAULT 'PENDING',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "place_metadata_json" JSONB NOT NULL DEFAULT '{}',
    "mismatch_flags_json" JSONB NOT NULL DEFAULT '{}',
    "confidence_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_address_verifications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_address_verifications_listing_id_key" ON "bnhub_address_verifications"("listing_id");
ALTER TABLE "bnhub_address_verifications" ADD CONSTRAINT "bnhub_address_verifications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_media_validations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "cover_photo_score" INTEGER NOT NULL DEFAULT 0,
    "photo_coverage_score" INTEGER NOT NULL DEFAULT 0,
    "exterior_photo_present" BOOLEAN NOT NULL DEFAULT false,
    "duplicate_image_risk_score" INTEGER NOT NULL DEFAULT 0,
    "image_consistency_score" INTEGER NOT NULL DEFAULT 0,
    "streetview_comparison_status" "BnhubTrustStreetviewCompareStatus" NOT NULL DEFAULT 'NOT_RUN',
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_media_validations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_media_validations_listing_id_key" ON "bnhub_media_validations"("listing_id");
ALTER TABLE "bnhub_media_validations" ADD CONSTRAINT "bnhub_media_validations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_listing_risk_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "identity_score" INTEGER NOT NULL DEFAULT 0,
    "address_score" INTEGER NOT NULL DEFAULT 0,
    "media_score" INTEGER NOT NULL DEFAULT 0,
    "price_sanity_score" INTEGER NOT NULL DEFAULT 0,
    "duplication_score" INTEGER NOT NULL DEFAULT 0,
    "behavior_score" INTEGER NOT NULL DEFAULT 0,
    "safety_policy_score" INTEGER NOT NULL DEFAULT 0,
    "overall_risk_score" INTEGER NOT NULL DEFAULT 0,
    "overall_risk_level" "BnhubTrustRiskLevel" NOT NULL DEFAULT 'LOW',
    "trust_status" "BnhubTrustProfileStatus" NOT NULL DEFAULT 'TRUSTED',
    "payout_restriction_status" "BnhubTrustPayoutGateStatus" NOT NULL DEFAULT 'NONE',
    "promotion_eligibility_status" "BnhubTrustPromotionGateStatus" NOT NULL DEFAULT 'ELIGIBLE',
    "notes" TEXT,
    "breakdown_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_listing_risk_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_listing_risk_profiles_listing_id_key" ON "bnhub_listing_risk_profiles"("listing_id");
CREATE INDEX "bnhub_listing_risk_profiles_host_user_id_idx" ON "bnhub_listing_risk_profiles"("host_user_id");
CREATE INDEX "bnhub_listing_risk_profiles_overall_risk_level_idx" ON "bnhub_listing_risk_profiles"("overall_risk_level");
CREATE INDEX "bnhub_listing_risk_profiles_trust_status_idx" ON "bnhub_listing_risk_profiles"("trust_status");
ALTER TABLE "bnhub_listing_risk_profiles" ADD CONSTRAINT "bnhub_listing_risk_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_listing_risk_profiles" ADD CONSTRAINT "bnhub_listing_risk_profiles_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_risk_flags" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "user_id" TEXT,
    "reservation_id" TEXT,
    "flag_type" "BnhubTrustRiskFlagTypeV2" NOT NULL,
    "severity" "BnhubFraudSeverity" NOT NULL,
    "visibility_scope" "BnhubTrustRiskFlagVisibility" NOT NULL DEFAULT 'ADMIN_ONLY',
    "flag_status" "BnhubFraudFlagStatus" NOT NULL DEFAULT 'OPEN',
    "auto_generated" BOOLEAN NOT NULL DEFAULT true,
    "summary" TEXT NOT NULL,
    "evidence_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_risk_flags_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_risk_flags_listing_id_idx" ON "bnhub_risk_flags"("listing_id");
CREATE INDEX "bnhub_risk_flags_user_id_idx" ON "bnhub_risk_flags"("user_id");
CREATE INDEX "bnhub_risk_flags_reservation_id_idx" ON "bnhub_risk_flags"("reservation_id");
CREATE INDEX "bnhub_risk_flags_flag_type_idx" ON "bnhub_risk_flags"("flag_type");
CREATE INDEX "bnhub_risk_flags_flag_status_idx" ON "bnhub_risk_flags"("flag_status");
CREATE INDEX "bnhub_risk_flags_severity_idx" ON "bnhub_risk_flags"("severity");
ALTER TABLE "bnhub_risk_flags" ADD CONSTRAINT "bnhub_risk_flags_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_risk_flags" ADD CONSTRAINT "bnhub_risk_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_risk_flags" ADD CONSTRAINT "bnhub_risk_flags_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "bnhub_location_policy_profiles" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "policy_status" "BnhubTrustLocationPolicyStatus" NOT NULL DEFAULT 'PENDING',
    "zone_policy_result" "BnhubTrustZonePolicyResult" NOT NULL DEFAULT 'UNKNOWN',
    "access_safety_result" "BnhubTrustAccessSafetyResult" NOT NULL DEFAULT 'CLEAR',
    "evidence_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_location_policy_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_location_policy_profiles_listing_id_key" ON "bnhub_location_policy_profiles"("listing_id");
CREATE INDEX "bnhub_location_policy_profiles_policy_status_idx" ON "bnhub_location_policy_profiles"("policy_status");
ALTER TABLE "bnhub_location_policy_profiles" ADD CONSTRAINT "bnhub_location_policy_profiles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_identity_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_type" "BnhubTrustIdentityAuditActor" NOT NULL,
    "actor_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_summary" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_identity_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_identity_audit_logs_entity_type_entity_id_idx" ON "bnhub_identity_audit_logs"("entity_type", "entity_id");
CREATE INDEX "bnhub_identity_audit_logs_actor_type_idx" ON "bnhub_identity_audit_logs"("actor_type");
CREATE INDEX "bnhub_identity_audit_logs_created_at_idx" ON "bnhub_identity_audit_logs"("created_at");
