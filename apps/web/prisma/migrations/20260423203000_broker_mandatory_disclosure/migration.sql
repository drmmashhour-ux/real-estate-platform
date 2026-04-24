-- OACIQ mandatory broker disclosure (role / interest attestation)

CREATE TYPE "BrokerDisclosureRole" AS ENUM ('BROKER', 'BUYER', 'SELLER', 'INVESTOR');

CREATE TABLE "broker_disclosures" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "listing_id" TEXT,
    "fsbo_listing_id" TEXT,
    "role" "BrokerDisclosureRole" NOT NULL,
    "has_conflict" BOOLEAN NOT NULL,
    "conflict_description" TEXT,
    "disclosed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declaration_line" TEXT NOT NULL,

    CONSTRAINT "broker_disclosures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "broker_disclosures_broker_id_idx" ON "broker_disclosures"("broker_id");
CREATE INDEX "broker_disclosures_deal_id_idx" ON "broker_disclosures"("deal_id");
CREATE INDEX "broker_disclosures_listing_id_idx" ON "broker_disclosures"("listing_id");
CREATE INDEX "broker_disclosures_fsbo_listing_id_idx" ON "broker_disclosures"("fsbo_listing_id");
CREATE INDEX "broker_disclosures_broker_id_disclosed_at_idx" ON "broker_disclosures"("broker_id", "disclosed_at" DESC);

ALTER TABLE "broker_disclosures" ADD CONSTRAINT "broker_disclosures_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "broker_disclosures" ADD CONSTRAINT "broker_disclosures_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "broker_disclosures" ADD CONSTRAINT "broker_disclosures_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "broker_disclosures" ADD CONSTRAINT "broker_disclosures_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
