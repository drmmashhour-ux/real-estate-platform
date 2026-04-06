-- Legal hub acknowledgments (signable gates across Buyer, Seller, BNHub, Mortgage, Broker)

CREATE TABLE "legal_form_signatures" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "form_key" TEXT NOT NULL,
    "context_type" TEXT NOT NULL,
    "context_id" TEXT NOT NULL DEFAULT '',
    "version" TEXT NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "legal_form_signatures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legal_form_signatures_user_id_form_key_context_type_context_id_key" ON "legal_form_signatures"("user_id", "form_key", "context_type", "context_id");

CREATE INDEX "legal_form_signatures_user_id_form_key_idx" ON "legal_form_signatures"("user_id", "form_key");

CREATE INDEX "legal_form_signatures_context_type_context_id_idx" ON "legal_form_signatures"("context_type", "context_id");

ALTER TABLE "legal_form_signatures" ADD CONSTRAINT "legal_form_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
