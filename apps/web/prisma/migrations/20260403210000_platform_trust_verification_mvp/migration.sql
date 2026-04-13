-- Platform trust & verification (MVP). Distinct from BNHub `trust_scores` snapshot table.

CREATE TYPE "VerificationLevel" AS ENUM ('basic', 'enhanced', 'full');
CREATE TYPE "PlatformTrustEntityType" AS ENUM ('user', 'host', 'broker', 'listing');
CREATE TYPE "PlatformTrustTier" AS ENUM ('low', 'medium', 'high', 'trusted');
CREATE TYPE "VerificationRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "verification_profiles" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "identity_verified" BOOLEAN NOT NULL DEFAULT false,
    "broker_verified" BOOLEAN NOT NULL DEFAULT false,
    "payment_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_level" "VerificationLevel" NOT NULL DEFAULT 'basic',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "verification_profiles_user_id_key" ON "verification_profiles"("user_id");
CREATE INDEX "verification_profiles_verification_level_idx" ON "verification_profiles"("verification_level");

ALTER TABLE "verification_profiles" ADD CONSTRAINT "verification_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "listing_verifications" (
    "id" UUID NOT NULL,
    "listing_id" TEXT NOT NULL,
    "contact_verified" BOOLEAN NOT NULL DEFAULT false,
    "address_verified" BOOLEAN NOT NULL DEFAULT false,
    "photo_verified" BOOLEAN NOT NULL DEFAULT false,
    "content_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "verification_level" "VerificationLevel" NOT NULL DEFAULT 'basic',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listing_verifications_listing_id_key" ON "listing_verifications"("listing_id");
CREATE INDEX "listing_verifications_verification_level_idx" ON "listing_verifications"("verification_level");

CREATE TABLE "platform_trust_scores" (
    "id" UUID NOT NULL,
    "entity_type" "PlatformTrustEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "level" "PlatformTrustTier" NOT NULL DEFAULT 'low',
    "reasons_json" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_trust_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_trust_scores_entity_type_entity_id_key" ON "platform_trust_scores"("entity_type", "entity_id");
CREATE INDEX "platform_trust_scores_level_idx" ON "platform_trust_scores"("level");

CREATE TABLE "verification_requests" (
    "id" UUID NOT NULL,
    "user_id" TEXT,
    "listing_id" TEXT,
    "type" TEXT NOT NULL,
    "status" "VerificationRequestStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "verification_requests_status_idx" ON "verification_requests"("status");
CREATE INDEX "verification_requests_user_id_idx" ON "verification_requests"("user_id");
CREATE INDEX "verification_requests_listing_id_idx" ON "verification_requests"("listing_id");

ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
