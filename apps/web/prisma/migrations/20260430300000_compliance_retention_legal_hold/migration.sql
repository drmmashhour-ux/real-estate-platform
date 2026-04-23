-- Record retention + legal hold (compliance preservation layer).

CREATE TABLE "compliance_legal_holds" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "hold_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "applies_globally" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "imposed_by_actor_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_legal_holds_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_legal_hold_owner_active" ON "compliance_legal_holds"("owner_type", "owner_id", "active");
CREATE INDEX "idx_legal_hold_entity_active" ON "compliance_legal_holds"("entity_type", "entity_id", "active");

CREATE TABLE "compliance_record_retention" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "retention_until" TIMESTAMP(3),
    "immutable" BOOLEAN NOT NULL DEFAULT false,
    "legal_hold_active" BOOLEAN NOT NULL DEFAULT false,
    "legal_hold_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_record_retention_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_record_retention_entity" ON "compliance_record_retention"("entity_type", "entity_id");
CREATE INDEX "idx_record_retention_owner" ON "compliance_record_retention"("owner_type", "owner_id");
