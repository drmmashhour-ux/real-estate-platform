-- Lease contracts: HTML body, booking link, e-signatures, external provider placeholders

ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "booking_id" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "content_html" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "external_provider" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "external_envelope_id" TEXT;

UPDATE "contracts" SET "updated_at" = COALESCE("created_at", CURRENT_TIMESTAMP) WHERE "updated_at" IS NULL;

CREATE INDEX IF NOT EXISTS "contracts_booking_id_idx" ON "contracts"("booking_id");
CREATE INDEX IF NOT EXISTS "contracts_created_by_id_idx" ON "contracts"("created_by_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_created_by_id_fkey') THEN
    ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_booking_id_fkey') THEN
    ALTER TABLE "contracts" ADD CONSTRAINT "contracts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "contract_signatures" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "signed_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "signature_data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contract_signatures_contract_id_idx" ON "contract_signatures"("contract_id");
CREATE INDEX IF NOT EXISTS "contract_signatures_user_id_idx" ON "contract_signatures"("user_id");
CREATE INDEX IF NOT EXISTS "contract_signatures_email_idx" ON "contract_signatures"("email");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contract_signatures_contract_id_fkey') THEN
    ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contract_signatures_user_id_fkey') THEN
    ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
