-- LECIPM Legal Management: corporate documents + company structure

CREATE TABLE "corporate_legal_documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corporate_legal_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "corporate_legal_documents_type_idx" ON "corporate_legal_documents"("type");
CREATE INDEX "corporate_legal_documents_status_idx" ON "corporate_legal_documents"("status");

CREATE TABLE "company_structures" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_structures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "company_structures_jurisdiction_idx" ON "company_structures"("jurisdiction");
