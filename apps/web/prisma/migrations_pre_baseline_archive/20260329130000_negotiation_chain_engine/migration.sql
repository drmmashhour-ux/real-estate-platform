-- LECIPM negotiation chain (versioned offers / counters)

CREATE TYPE "negotiation_chain_status" AS ENUM ('active', 'accepted', 'rejected');
CREATE TYPE "negotiation_version_role" AS ENUM ('buyer', 'seller', 'broker');
CREATE TYPE "negotiation_version_status" AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE "negotiation_chains" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "case_id" TEXT,
    "status" "negotiation_chain_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "negotiation_chains_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "negotiation_versions" (
    "id" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "parent_version_id" TEXT,
    "created_by" TEXT NOT NULL,
    "role" "negotiation_version_role" NOT NULL,
    "status" "negotiation_version_status" NOT NULL DEFAULT 'pending',
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negotiation_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "negotiation_terms" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "deposit_cents" INTEGER,
    "financing_terms" JSONB NOT NULL DEFAULT '{}',
    "commission_terms" JSONB NOT NULL DEFAULT '{}',
    "deadlines" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "negotiation_terms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "negotiation_clauses" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "clause_type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "added_in_version" INTEGER NOT NULL,
    "removed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "negotiation_clauses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "negotiation_terms_version_id_key" ON "negotiation_terms"("version_id");

CREATE UNIQUE INDEX "uq_negotiation_versions_chain_version" ON "negotiation_versions"("chain_id", "version_number");

CREATE INDEX "negotiation_chains_property_id_idx" ON "negotiation_chains"("property_id");

CREATE INDEX "negotiation_chains_case_id_idx" ON "negotiation_chains"("case_id");

CREATE INDEX "negotiation_chains_status_idx" ON "negotiation_chains"("status");

CREATE INDEX "negotiation_versions_chain_id_idx" ON "negotiation_versions"("chain_id");

CREATE INDEX "negotiation_versions_parent_version_id_idx" ON "negotiation_versions"("parent_version_id");

CREATE INDEX "negotiation_versions_status_idx" ON "negotiation_versions"("status");

CREATE INDEX "negotiation_clauses_version_id_idx" ON "negotiation_clauses"("version_id");

ALTER TABLE "negotiation_chains" ADD CONSTRAINT "negotiation_chains_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "negotiation_chains" ADD CONSTRAINT "negotiation_chains_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "seller_declaration_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "negotiation_versions" ADD CONSTRAINT "negotiation_versions_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "negotiation_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "negotiation_versions" ADD CONSTRAINT "negotiation_versions_parent_version_id_fkey" FOREIGN KEY ("parent_version_id") REFERENCES "negotiation_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "negotiation_versions" ADD CONSTRAINT "negotiation_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "negotiation_terms" ADD CONSTRAINT "negotiation_terms_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "negotiation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "negotiation_clauses" ADD CONSTRAINT "negotiation_clauses_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "negotiation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
