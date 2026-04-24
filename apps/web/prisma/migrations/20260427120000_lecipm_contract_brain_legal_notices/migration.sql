-- LECIPM Contract Brain: legal notice acknowledgements + signature gate audit rows

CREATE TABLE "contract_legal_notices" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "user_id" TEXT,
    "notice_key" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content_snapshot" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "ip_address" VARCHAR(128),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_legal_notices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_signature_gates" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "user_id" TEXT,
    "gate_key" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "passed_at" TIMESTAMP(3),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_signature_gates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contract_legal_notices_contract_id_user_id_notice_key_version_key" ON "contract_legal_notices"("contract_id", "user_id", "notice_key", "version");

CREATE INDEX "contract_legal_notices_contract_id_idx" ON "contract_legal_notices"("contract_id");

CREATE INDEX "contract_legal_notices_user_id_idx" ON "contract_legal_notices"("user_id");

CREATE INDEX "contract_legal_notices_notice_key_idx" ON "contract_legal_notices"("notice_key");

CREATE UNIQUE INDEX "contract_signature_gates_contract_id_gate_key_key" ON "contract_signature_gates"("contract_id", "gate_key");

CREATE INDEX "contract_signature_gates_user_id_idx" ON "contract_signature_gates"("user_id");

ALTER TABLE "contract_legal_notices" ADD CONSTRAINT "contract_legal_notices_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contract_legal_notices" ADD CONSTRAINT "contract_legal_notices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contract_signature_gates" ADD CONSTRAINT "contract_signature_gates_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contract_signature_gates" ADD CONSTRAINT "contract_signature_gates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
