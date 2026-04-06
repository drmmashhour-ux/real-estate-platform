-- Long-term Rent Hub: listings, applications, leases, payments

DO $$ BEGIN
  CREATE TYPE "RentalListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RENTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RentalApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RentalLeaseStatus" AS ENUM ('PENDING_SIGNATURE', 'ACTIVE', 'TERMINATED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RentPaymentStatus" AS ENUM ('PENDING', 'PAID', 'LATE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "rental_listings" (
  "id" TEXT NOT NULL,
  "listing_code" TEXT NOT NULL,
  "landlord_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price_monthly" INTEGER NOT NULL,
  "deposit_amount" INTEGER NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT,
  "status" "RentalListingStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rental_listings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "rental_listings_listing_code_key" ON "rental_listings"("listing_code");
CREATE INDEX IF NOT EXISTS "rental_listings_landlord_id_idx" ON "rental_listings"("landlord_id");
CREATE INDEX IF NOT EXISTS "rental_listings_status_idx" ON "rental_listings"("status");

DO $$ BEGIN
  ALTER TABLE "rental_listings" ADD CONSTRAINT "rental_listings_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "rental_applications" (
  "id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "RentalApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "legal_accepted_at" TIMESTAMP(3),
  "documents_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rental_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "rental_applications_listing_id_idx" ON "rental_applications"("listing_id");
CREATE INDEX IF NOT EXISTS "rental_applications_tenant_id_idx" ON "rental_applications"("tenant_id");
CREATE INDEX IF NOT EXISTS "rental_applications_status_idx" ON "rental_applications"("status");

DO $$ BEGIN
  ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "rental_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "rental_leases" (
  "id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "landlord_id" TEXT NOT NULL,
  "application_id" TEXT,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3) NOT NULL,
  "monthly_rent" INTEGER NOT NULL,
  "deposit" INTEGER NOT NULL,
  "status" "RentalLeaseStatus" NOT NULL DEFAULT 'PENDING_SIGNATURE',
  "signed_at" TIMESTAMP(3),
  "contract_text" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rental_leases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "rental_leases_application_id_key" ON "rental_leases"("application_id");
CREATE INDEX IF NOT EXISTS "rental_leases_tenant_id_idx" ON "rental_leases"("tenant_id");
CREATE INDEX IF NOT EXISTS "rental_leases_landlord_id_idx" ON "rental_leases"("landlord_id");
CREATE INDEX IF NOT EXISTS "rental_leases_listing_id_idx" ON "rental_leases"("listing_id");

DO $$ BEGIN
  ALTER TABLE "rental_leases" ADD CONSTRAINT "rental_leases_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "rental_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rental_leases" ADD CONSTRAINT "rental_leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rental_leases" ADD CONSTRAINT "rental_leases_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rental_leases" ADD CONSTRAINT "rental_leases_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "rental_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "rent_payments" (
  "id" TEXT NOT NULL,
  "lease_id" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "due_date" TIMESTAMP(3) NOT NULL,
  "status" "RentPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rent_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "rent_payments_lease_id_idx" ON "rent_payments"("lease_id");
CREATE INDEX IF NOT EXISTS "rent_payments_due_date_idx" ON "rent_payments"("due_date");
CREATE INDEX IF NOT EXISTS "rent_payments_status_idx" ON "rent_payments"("status");

DO $$ BEGIN
  ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "rental_leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
