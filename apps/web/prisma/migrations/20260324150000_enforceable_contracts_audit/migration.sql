-- Enforceable contract text + signer audit + immutable audit log

ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "content_text" TEXT;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "is_signed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "signer_ip_address" TEXT;

CREATE INDEX IF NOT EXISTS "contracts_is_signed_idx" ON "contracts"("is_signed");

CREATE TABLE "legal_contract_audit_logs" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "version" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_contract_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_contract_audit_logs_contract_id_idx" ON "legal_contract_audit_logs"("contract_id");
CREATE INDEX "legal_contract_audit_logs_user_id_idx" ON "legal_contract_audit_logs"("user_id");
CREATE INDEX "legal_contract_audit_logs_created_at_idx" ON "legal_contract_audit_logs"("created_at");

ALTER TABLE "legal_contract_audit_logs" ADD CONSTRAINT "legal_contract_audit_logs_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "legal_contract_audit_logs" ADD CONSTRAINT "legal_contract_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
