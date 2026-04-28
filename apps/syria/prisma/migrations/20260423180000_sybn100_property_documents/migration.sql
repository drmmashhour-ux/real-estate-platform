-- ORDER SYBNB-100 — Property proof documents (private URLs; public badge only).

ALTER TABLE "syria_properties" ADD COLUMN "proof_documents_submitted" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "property_documents" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "property_documents_property_id_idx" ON "property_documents"("property_id");

ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "syria_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
