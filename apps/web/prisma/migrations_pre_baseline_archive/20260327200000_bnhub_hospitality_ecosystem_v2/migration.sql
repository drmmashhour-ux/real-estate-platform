-- BNHub hospitality ecosystem v2: extended catalog, reservation lines, bundles, concierge, membership, providers, safety, travel placeholders.
-- Requires prior migration 20260326140000_bnhub_hospitality_addons_engine.

-- Extend existing enums (PostgreSQL 11+; run each ADD VALUE once)
ALTER TYPE "BnhubAddonServiceCategory" ADD VALUE 'ACCESS';
ALTER TYPE "BnhubAddonServiceCategory" ADD VALUE 'HOSPITALITY';
ALTER TYPE "BnhubAddonServiceCategory" ADD VALUE 'CONCIERGE';

ALTER TYPE "BnhubListingServicePricingType" ADD VALUE 'QUOTE_REQUIRED';

ALTER TYPE "BnhubBookingServiceLineStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "BnhubBookingServiceLineStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "BnhubBookingServiceLineStatus" ADD VALUE 'REJECTED';

ALTER TYPE "BnhubServiceRequestStatus" ADD VALUE 'CANCELLED';

-- New enums
CREATE TYPE "BnhubServiceScope" AS ENUM ('LISTING_HOSTED', 'PLATFORM_MANAGED', 'PARTNER_MANAGED', 'REQUEST_ONLY');
CREATE TYPE "BnhubCatalogPricingBehavior" AS ENUM ('FREE', 'FIXED', 'PER_DAY', 'PER_GUEST', 'PER_BOOKING', 'QUOTE_REQUIRED');
CREATE TYPE "BnhubListingServiceModerationStatus" AS ENUM ('APPROVED', 'PENDING_REVIEW', 'RESTRICTED', 'SUSPENDED');
CREATE TYPE "BnhubServiceSelectedFrom" AS ENUM ('BOOKING_FLOW', 'POST_BOOKING', 'CONCIERGE', 'BUNDLE');
CREATE TYPE "BnhubServiceRequestType" AS ENUM ('SERVICE_REQUEST', 'CONCIERGE_REQUEST', 'EARLY_CHECKIN', 'LATE_CHECKOUT', 'TRANSPORT_QUOTE', 'CUSTOM_REQUEST');
CREATE TYPE "BnhubBundleTargetSegment" AS ENUM ('ROMANTIC', 'FAMILY', 'BUSINESS', 'LUXURY', 'LONG_STAY', 'ARRIVAL', 'WELLNESS', 'CUSTOM');
CREATE TYPE "BnhubBundlePricingType" AS ENUM ('FIXED', 'DYNAMIC', 'MIXED');
CREATE TYPE "BnhubBundleVisibilityScope" AS ENUM ('PUBLIC', 'MEMBERS_ONLY', 'HOST_SELECTED', 'ADMIN_SELECTED');
CREATE TYPE "BnhubBookingBundleStatus" AS ENUM ('SELECTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "BnhubConciergeRoleContext" AS ENUM ('GUEST', 'HOST', 'ADMIN');
CREATE TYPE "BnhubConciergeSessionStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ESCALATED');
CREATE TYPE "BnhubConciergeAiMode" AS ENUM ('MOCK', 'FALLBACK', 'PROVIDER');
CREATE TYPE "BnhubConciergeSenderType" AS ENUM ('USER', 'AI', 'ADMIN', 'HOST');
CREATE TYPE "BnhubConciergeMessageType" AS ENUM ('TEXT', 'RECOMMENDATION', 'BUNDLE_OFFER', 'SERVICE_OFFER', 'ESCALATION_NOTE');
CREATE TYPE "BnhubMembershipAudienceType" AS ENUM ('GUEST', 'HOST', 'UNIVERSAL');
CREATE TYPE "BnhubMembershipBillingCycle" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME');
CREATE TYPE "BnhubUserMembershipStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAUSED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "BnhubMembershipRenewalMode" AS ENUM ('AUTO', 'MANUAL');
CREATE TYPE "BnhubProviderType" AS ENUM ('HOST', 'PARTNER', 'PLATFORM');
CREATE TYPE "BnhubProviderVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'RESTRICTED');
CREATE TYPE "BnhubHospitalitySafetyScopeType" AS ENUM ('GLOBAL', 'LISTING', 'HOST', 'REGION', 'SAFETY_STATUS');
CREATE TYPE "BnhubHospitalityAuditActorType" AS ENUM ('SYSTEM', 'AI', 'GUEST', 'HOST', 'ADMIN');
CREATE TYPE "BnhubTravelProductType" AS ENUM ('HOTEL', 'TRANSPORT', 'FLIGHT', 'ACTIVITY', 'PARTNER_SERVICE');
CREATE TYPE "BnhubTravelProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RESTRICTED', 'ARCHIVED');

-- Catalog extensions
ALTER TABLE "bnhub_services" ADD COLUMN IF NOT EXISTS "short_description" TEXT;
ALTER TABLE "bnhub_services" ADD COLUMN IF NOT EXISTS "full_description" TEXT;
ALTER TABLE "bnhub_services" ADD COLUMN IF NOT EXISTS "icon_key" TEXT;
ALTER TABLE "bnhub_services" ADD COLUMN IF NOT EXISTS "service_scope" "BnhubServiceScope" NOT NULL DEFAULT 'LISTING_HOSTED';
ALTER TABLE "bnhub_services" ADD COLUMN IF NOT EXISTS "pricing_behavior" "BnhubCatalogPricingBehavior" NOT NULL DEFAULT 'FIXED';
ALTER TABLE "bnhub_services" ADD COLUMN IF NOT EXISTS "default_requires_approval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bnhub_services" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Listing service extensions
ALTER TABLE "bnhub_listing_services" ADD COLUMN IF NOT EXISTS "host_user_id" TEXT;
ALTER TABLE "bnhub_listing_services" ADD COLUMN IF NOT EXISTS "capacity_limit" INTEGER;
ALTER TABLE "bnhub_listing_services" ADD COLUMN IF NOT EXISTS "advance_notice_hours" INTEGER;
ALTER TABLE "bnhub_listing_services" ADD COLUMN IF NOT EXISTS "moderation_status" "BnhubListingServiceModerationStatus" NOT NULL DEFAULT 'APPROVED';
DO $$ BEGIN
  ALTER TABLE "bnhub_listing_services" ADD CONSTRAINT "bnhub_listing_services_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "bnhub_listing_services_host_user_id_idx" ON "bnhub_listing_services"("host_user_id");

-- Booking service (reservation line) extensions
ALTER TABLE "bnhub_booking_services" ADD COLUMN IF NOT EXISTS "guest_user_id" TEXT;
ALTER TABLE "bnhub_booking_services" ADD COLUMN IF NOT EXISTS "host_user_id" TEXT;
ALTER TABLE "bnhub_booking_services" ADD COLUMN IF NOT EXISTS "line_pricing_type" "BnhubListingServicePricingType";
ALTER TABLE "bnhub_booking_services" ADD COLUMN IF NOT EXISTS "service_date" DATE;
ALTER TABLE "bnhub_booking_services" ADD COLUMN IF NOT EXISTS "selected_from" "BnhubServiceSelectedFrom" NOT NULL DEFAULT 'BOOKING_FLOW';
ALTER TABLE "bnhub_booking_services" ADD COLUMN IF NOT EXISTS "notes" TEXT;
DO $$ BEGIN
  ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "bnhub_booking_services_guest_user_id_idx" ON "bnhub_booking_services"("guest_user_id");
CREATE INDEX IF NOT EXISTS "bnhub_booking_services_host_user_id_idx" ON "bnhub_booking_services"("host_user_id");

-- Service requests extensions
ALTER TABLE "bnhub_service_requests" ADD COLUMN IF NOT EXISTS "listing_id" TEXT;
ALTER TABLE "bnhub_service_requests" ADD COLUMN IF NOT EXISTS "request_type" "BnhubServiceRequestType" NOT NULL DEFAULT 'SERVICE_REQUEST';
ALTER TABLE "bnhub_service_requests" ADD COLUMN IF NOT EXISTS "admin_review_required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "bnhub_service_requests" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
DO $$ BEGIN
  ALTER TABLE "bnhub_service_requests" ADD CONSTRAINT "bnhub_service_requests_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "bnhub_service_requests_listing_id_idx" ON "bnhub_service_requests"("listing_id");

ALTER TABLE "bnhub_service_requests" ALTER COLUMN "service_id" DROP NOT NULL;
ALTER TABLE "bnhub_service_requests" ALTER COLUMN "host_user_id" DROP NOT NULL;

UPDATE "bnhub_service_requests" r SET "listing_id" = b."listingId" FROM "Booking" b WHERE r."booking_id" = b."id" AND r."listing_id" IS NULL;

-- Bundles
CREATE TABLE "bnhub_service_bundles" (
    "id" TEXT NOT NULL,
    "bundle_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_segment" "BnhubBundleTargetSegment" NOT NULL,
    "pricing_type" "BnhubBundlePricingType" NOT NULL,
    "base_price_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "visibility_scope" "BnhubBundleVisibilityScope" NOT NULL DEFAULT 'PUBLIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_service_bundles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_service_bundles_bundle_code_key" ON "bnhub_service_bundles"("bundle_code");
CREATE INDEX "bnhub_service_bundles_is_active_idx" ON "bnhub_service_bundles"("is_active");
CREATE INDEX "bnhub_service_bundles_target_segment_idx" ON "bnhub_service_bundles"("target_segment");

CREATE TABLE "bnhub_bundle_items" (
    "id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "default_quantity" INTEGER NOT NULL DEFAULT 1,
    "pricing_override_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_bundle_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_bundle_items_bundle_id_idx" ON "bnhub_bundle_items"("bundle_id");
CREATE INDEX "bnhub_bundle_items_service_id_idx" ON "bnhub_bundle_items"("service_id");
ALTER TABLE "bnhub_bundle_items" ADD CONSTRAINT "bnhub_bundle_items_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bnhub_service_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_bundle_items" ADD CONSTRAINT "bnhub_bundle_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bnhub_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_booking_bundles" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "total_price_cents" INTEGER NOT NULL,
    "bundle_status" "BnhubBookingBundleStatus" NOT NULL DEFAULT 'SELECTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_booking_bundles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_booking_bundles_booking_id_idx" ON "bnhub_booking_bundles"("booking_id");
CREATE INDEX "bnhub_booking_bundles_bundle_id_idx" ON "bnhub_booking_bundles"("bundle_id");
CREATE INDEX "bnhub_booking_bundles_guest_user_id_idx" ON "bnhub_booking_bundles"("guest_user_id");
CREATE INDEX "bnhub_booking_bundles_listing_id_idx" ON "bnhub_booking_bundles"("listing_id");
ALTER TABLE "bnhub_booking_bundles" ADD CONSTRAINT "bnhub_booking_bundles_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_booking_bundles" ADD CONSTRAINT "bnhub_booking_bundles_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bnhub_service_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bnhub_booking_bundles" ADD CONSTRAINT "bnhub_booking_bundles_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_booking_bundles" ADD CONSTRAINT "bnhub_booking_bundles_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Concierge
CREATE TABLE "bnhub_concierge_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "listing_id" TEXT,
    "role_context" "BnhubConciergeRoleContext" NOT NULL,
    "session_status" "BnhubConciergeSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "ai_mode" "BnhubConciergeAiMode" NOT NULL DEFAULT 'MOCK',
    "summary" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_concierge_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_concierge_sessions_user_id_idx" ON "bnhub_concierge_sessions"("user_id");
CREATE INDEX "bnhub_concierge_sessions_booking_id_idx" ON "bnhub_concierge_sessions"("booking_id");
CREATE INDEX "bnhub_concierge_sessions_listing_id_idx" ON "bnhub_concierge_sessions"("listing_id");
CREATE INDEX "bnhub_concierge_sessions_session_status_idx" ON "bnhub_concierge_sessions"("session_status");
ALTER TABLE "bnhub_concierge_sessions" ADD CONSTRAINT "bnhub_concierge_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_concierge_sessions" ADD CONSTRAINT "bnhub_concierge_sessions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bnhub_concierge_sessions" ADD CONSTRAINT "bnhub_concierge_sessions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "bnhub_concierge_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "sender_type" "BnhubConciergeSenderType" NOT NULL,
    "sender_id" TEXT,
    "message_text" TEXT NOT NULL,
    "message_type" "BnhubConciergeMessageType" NOT NULL DEFAULT 'TEXT',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_concierge_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_concierge_messages_session_id_idx" ON "bnhub_concierge_messages"("session_id");
CREATE INDEX "bnhub_concierge_messages_created_at_idx" ON "bnhub_concierge_messages"("created_at");
ALTER TABLE "bnhub_concierge_messages" ADD CONSTRAINT "bnhub_concierge_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "bnhub_concierge_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Membership
CREATE TABLE "bnhub_membership_plans" (
    "id" TEXT NOT NULL,
    "membership_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audience_type" "BnhubMembershipAudienceType" NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "billing_cycle" "BnhubMembershipBillingCycle" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "benefits_json" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_membership_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_membership_plans_membership_code_key" ON "bnhub_membership_plans"("membership_code");
CREATE INDEX "bnhub_membership_plans_is_active_idx" ON "bnhub_membership_plans"("is_active");

CREATE TABLE "bnhub_user_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "membership_status" "BnhubUserMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "renewal_mode" "BnhubMembershipRenewalMode" NOT NULL DEFAULT 'MANUAL',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_user_memberships_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_user_memberships_user_id_idx" ON "bnhub_user_memberships"("user_id");
CREATE INDEX "bnhub_user_memberships_plan_id_idx" ON "bnhub_user_memberships"("plan_id");
CREATE INDEX "bnhub_user_memberships_membership_status_idx" ON "bnhub_user_memberships"("membership_status");
ALTER TABLE "bnhub_user_memberships" ADD CONSTRAINT "bnhub_user_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_user_memberships" ADD CONSTRAINT "bnhub_user_memberships_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "bnhub_membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Providers & travel & safety & audit & discounts
CREATE TABLE "bnhub_service_provider_profiles" (
    "id" TEXT NOT NULL,
    "provider_type" "BnhubProviderType" NOT NULL,
    "provider_user_id" TEXT,
    "display_name" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "verification_status" "BnhubProviderVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "service_categories_json" JSONB NOT NULL DEFAULT '[]',
    "coverage_regions_json" JSONB NOT NULL DEFAULT '[]',
    "rating_summary_json" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_service_provider_profiles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_service_provider_profiles_provider_user_id_idx" ON "bnhub_service_provider_profiles"("provider_user_id");
CREATE INDEX "bnhub_service_provider_profiles_provider_type_idx" ON "bnhub_service_provider_profiles"("provider_type");
ALTER TABLE "bnhub_service_provider_profiles" ADD CONSTRAINT "bnhub_service_provider_profiles_provider_user_id_fkey" FOREIGN KEY ("provider_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "bnhub_service_safety_rules" (
    "id" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "service_code" TEXT,
    "category" "BnhubAddonServiceCategory",
    "scope_type" "BnhubHospitalitySafetyScopeType" NOT NULL,
    "scope_id" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "conditions_json" JSONB NOT NULL DEFAULT '{}',
    "actions_json" JSONB NOT NULL DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_service_safety_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_service_safety_rules_scope_type_idx" ON "bnhub_service_safety_rules"("scope_type");
CREATE INDEX "bnhub_service_safety_rules_scope_id_idx" ON "bnhub_service_safety_rules"("scope_id");
CREATE INDEX "bnhub_service_safety_rules_service_code_idx" ON "bnhub_service_safety_rules"("service_code");

CREATE TABLE "bnhub_service_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_type" "BnhubHospitalityAuditActorType" NOT NULL,
    "actor_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_summary" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_service_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_service_audit_logs_entity_idx" ON "bnhub_service_audit_logs"("entity_type", "entity_id");
CREATE INDEX "bnhub_service_audit_logs_actor_id_idx" ON "bnhub_service_audit_logs"("actor_id");
CREATE INDEX "bnhub_service_audit_logs_created_at_idx" ON "bnhub_service_audit_logs"("created_at");

CREATE TABLE "bnhub_travel_products" (
    "id" TEXT NOT NULL,
    "product_type" "BnhubTravelProductType" NOT NULL,
    "provider_profile_id" TEXT,
    "external_ref" TEXT,
    "title" TEXT NOT NULL,
    "location_json" JSONB NOT NULL DEFAULT '{}',
    "availability_json" JSONB,
    "pricing_json" JSONB,
    "status" "BnhubTravelProductStatus" NOT NULL DEFAULT 'DRAFT',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_travel_products_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_travel_products_product_type_idx" ON "bnhub_travel_products"("product_type");
CREATE INDEX "bnhub_travel_products_status_idx" ON "bnhub_travel_products"("status");
ALTER TABLE "bnhub_travel_products" ADD CONSTRAINT "bnhub_travel_products_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "bnhub_service_provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "bnhub_service_discount_rules" (
    "id" TEXT NOT NULL,
    "rule_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applies_to" TEXT NOT NULL,
    "discount_bps" INTEGER NOT NULL DEFAULT 0,
    "conditions_json" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_service_discount_rules_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_service_discount_rules_rule_code_key" ON "bnhub_service_discount_rules"("rule_code");
CREATE INDEX "bnhub_service_discount_rules_is_active_idx" ON "bnhub_service_discount_rules"("is_active");
