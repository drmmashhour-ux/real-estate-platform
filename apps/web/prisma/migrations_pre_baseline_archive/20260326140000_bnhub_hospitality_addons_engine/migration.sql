-- BNHub Services & Hospitality Add-ons Engine

CREATE TYPE "BnhubAddonServiceCategory" AS ENUM ('TRANSPORT', 'FOOD', 'CLEANING', 'CONVENIENCE', 'EXPERIENCE');
CREATE TYPE "BnhubListingServicePricingType" AS ENUM ('FREE', 'FIXED', 'PER_DAY', 'PER_GUEST', 'PER_BOOKING');
CREATE TYPE "BnhubBookingServiceLineStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "BnhubServiceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

CREATE TABLE "bnhub_services" (
    "id" TEXT NOT NULL,
    "service_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BnhubAddonServiceCategory" NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_premium_tier" BOOLEAN NOT NULL DEFAULT false,
    "min_listing_trust_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_services_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_services_service_code_key" ON "bnhub_services"("service_code");
CREATE INDEX "bnhub_services_category_idx" ON "bnhub_services"("category");
CREATE INDEX "bnhub_services_is_active_idx" ON "bnhub_services"("is_active");

CREATE TABLE "bnhub_listing_services" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "pricing_type" "BnhubListingServicePricingType" NOT NULL,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_included" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "availability_rules" JSONB,
    "notes" TEXT,
    "admin_disabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_listing_services_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bnhub_listing_services_listing_service_key" ON "bnhub_listing_services"("listing_id", "service_id");
CREATE INDEX "bnhub_listing_services_listing_id_idx" ON "bnhub_listing_services"("listing_id");
CREATE INDEX "bnhub_listing_services_service_id_idx" ON "bnhub_listing_services"("service_id");
ALTER TABLE "bnhub_listing_services" ADD CONSTRAINT "bnhub_listing_services_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_listing_services" ADD CONSTRAINT "bnhub_listing_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bnhub_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_booking_services" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "listing_service_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_cents" INTEGER NOT NULL,
    "total_price_cents" INTEGER NOT NULL,
    "status" "BnhubBookingServiceLineStatus" NOT NULL DEFAULT 'CONFIRMED',
    "selected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bnhub_booking_services_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_booking_services_booking_id_idx" ON "bnhub_booking_services"("booking_id");
CREATE INDEX "bnhub_booking_services_listing_id_idx" ON "bnhub_booking_services"("listing_id");
CREATE INDEX "bnhub_booking_services_service_id_idx" ON "bnhub_booking_services"("service_id");
ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_listing_service_id_fkey" FOREIGN KEY ("listing_service_id") REFERENCES "bnhub_listing_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bnhub_booking_services" ADD CONSTRAINT "bnhub_booking_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bnhub_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "bnhub_service_requests" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "BnhubServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bnhub_service_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bnhub_service_requests_booking_id_idx" ON "bnhub_service_requests"("booking_id");
CREATE INDEX "bnhub_service_requests_guest_user_id_idx" ON "bnhub_service_requests"("guest_user_id");
CREATE INDEX "bnhub_service_requests_host_user_id_idx" ON "bnhub_service_requests"("host_user_id");
CREATE INDEX "bnhub_service_requests_status_idx" ON "bnhub_service_requests"("status");
ALTER TABLE "bnhub_service_requests" ADD CONSTRAINT "bnhub_service_requests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_service_requests" ADD CONSTRAINT "bnhub_service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bnhub_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_service_requests" ADD CONSTRAINT "bnhub_service_requests_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bnhub_service_requests" ADD CONSTRAINT "bnhub_service_requests_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
