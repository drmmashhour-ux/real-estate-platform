-- OACIQ clause intelligence: library + contract instances + validation audit rows

CREATE TYPE "OaciqClauseLibraryCategory" AS ENUM (
  'brokerage_contract',
  'amendment',
  'promise_to_purchase',
  'other',
  'enterprise_sale'
);

CREATE TYPE "OaciqClauseFormVersion" AS ENUM ('2022_mandatory');

CREATE TABLE "clauses_library" (
    "id" TEXT NOT NULL,
    "category" "OaciqClauseLibraryCategory" NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "template_text" TEXT NOT NULL,
    "requires_deadline" BOOLEAN NOT NULL DEFAULT true,
    "requires_notice" BOOLEAN NOT NULL DEFAULT true,
    "requires_consequence" BOOLEAN NOT NULL DEFAULT true,
    "requires_actor" BOOLEAN NOT NULL DEFAULT true,
    "form_version" "OaciqClauseFormVersion" NOT NULL DEFAULT '2022_mandatory',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "enforcement_key" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clauses_library_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clauses_library_code_key" ON "clauses_library"("code");
CREATE INDEX "clauses_library_category_active_idx" ON "clauses_library"("category", "active");

CREATE TABLE "contract_clauses" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "clause_id" TEXT NOT NULL,
    "custom_text" TEXT,
    "actor_defined" BOOLEAN NOT NULL DEFAULT false,
    "deadline_defined" BOOLEAN NOT NULL DEFAULT false,
    "notice_defined" BOOLEAN NOT NULL DEFAULT false,
    "consequence_defined" BOOLEAN NOT NULL DEFAULT false,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "validation_errors" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_clauses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contract_clauses_contract_id_idx" ON "contract_clauses"("contract_id");
CREATE INDEX "contract_clauses_clause_id_idx" ON "contract_clauses"("clause_id");

ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_clause_id_fkey"
  FOREIGN KEY ("clause_id") REFERENCES "clauses_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "clause_validations" (
    "id" TEXT NOT NULL,
    "contract_clause_id" TEXT NOT NULL,
    "missing_actor" BOOLEAN NOT NULL DEFAULT false,
    "missing_deadline" BOOLEAN NOT NULL DEFAULT false,
    "missing_consequence" BOOLEAN NOT NULL DEFAULT false,
    "missing_notice" BOOLEAN NOT NULL DEFAULT false,
    "ambiguous_language" BOOLEAN NOT NULL DEFAULT false,
    "ai_flag" BOOLEAN NOT NULL DEFAULT false,
    "error_codes" JSONB,
    "validated_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clause_validations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clause_validations_contract_clause_id_created_at_idx"
  ON "clause_validations"("contract_clause_id", "created_at" DESC);

ALTER TABLE "clause_validations" ADD CONSTRAINT "clause_validations_contract_clause_id_fkey"
  FOREIGN KEY ("contract_clause_id") REFERENCES "contract_clauses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clause_validations" ADD CONSTRAINT "clause_validations_validated_by_user_id_fkey"
  FOREIGN KEY ("validated_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
