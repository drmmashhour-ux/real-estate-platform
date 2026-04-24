-- OACIQ-oriented broker conflict disclosure: client acknowledgment records + deal progression gate support.

CREATE TABLE "deal_conflict_client_consents" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "acknowledgment_text" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_ip" VARCHAR(64),
    "user_agent" VARCHAR(512),

    CONSTRAINT "deal_conflict_client_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_conflict_client_consents_deal_id_user_id_key" ON "deal_conflict_client_consents"("deal_id", "user_id");
CREATE INDEX "deal_conflict_client_consents_deal_id_idx" ON "deal_conflict_client_consents"("deal_id");
CREATE INDEX "deal_conflict_client_consents_user_id_idx" ON "deal_conflict_client_consents"("user_id");

ALTER TABLE "deal_conflict_client_consents" ADD CONSTRAINT "deal_conflict_client_consents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_conflict_client_consents" ADD CONSTRAINT "deal_conflict_client_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
