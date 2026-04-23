-- Contract registry numbering + compliance inspection + optional contract.contract_number

CREATE TABLE IF NOT EXISTS "contract_registry" (
    "id" TEXT NOT NULL,
    "contract_number" VARCHAR(80) NOT NULL,
    "contract_type" VARCHAR(64) NOT NULL,
    "listing_id" TEXT,
    "deal_id" TEXT,
    "contract_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_registry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "contract_registry_contract_number_key" ON "contract_registry"("contract_number");
CREATE INDEX IF NOT EXISTS "idx_contract_registry_type" ON "contract_registry"("contract_type");
CREATE INDEX IF NOT EXISTS "idx_contract_registry_listing" ON "contract_registry"("listing_id");
CREATE INDEX IF NOT EXISTS "idx_contract_registry_deal" ON "contract_registry"("deal_id");

CREATE TABLE IF NOT EXISTS "compliance_inspections" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "result" VARCHAR(16) NOT NULL,
    "issues" JSONB NOT NULL,
    "context" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_inspections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_compliance_inspections_owner_created" ON "compliance_inspections"("owner_id", "created_at" DESC);

ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "contract_number" VARCHAR(80);
CREATE UNIQUE INDEX IF NOT EXISTS "contracts_contract_number_key" ON "contracts"("contract_number");
