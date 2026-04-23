-- Traceable form signatures + compliance seller declaration linkage (draft execution / audit).

CREATE TABLE "form_signatures" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "signer_id" VARCHAR(36) NOT NULL,
    "signer_type" VARCHAR(24) NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL,
    "signed_date" VARCHAR(16) NOT NULL,
    "signed_time" VARCHAR(16) NOT NULL,
    "signed_city" VARCHAR(160),
    "signature_method" VARCHAR(24) NOT NULL,
    "signature_hash" VARCHAR(128) NOT NULL,
    "document_hash" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_signatures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "form_signatures_entity_type_entity_id_idx" ON "form_signatures"("entity_type", "entity_id");
CREATE INDEX "form_signatures_signer_id_idx" ON "form_signatures"("signer_id");
CREATE INDEX "form_signatures_signed_at_idx" ON "form_signatures"("signed_at");

ALTER TABLE "form_signatures" ADD CONSTRAINT "form_signatures_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "compliance_seller_declarations" (
    "id" TEXT NOT NULL,
    "listing_id" VARCHAR(64),
    "contract_id" VARCHAR(64),
    "reference_number" VARCHAR(48) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'recorded',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_seller_declarations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compliance_seller_declarations_reference_number_key" ON "compliance_seller_declarations"("reference_number");
CREATE INDEX "compliance_seller_declarations_listing_id_idx" ON "compliance_seller_declarations"("listing_id");
CREATE INDEX "compliance_seller_declarations_contract_id_idx" ON "compliance_seller_declarations"("contract_id");
