-- $100K fundraising round + investor commitments

CREATE TABLE "fundraising_rounds" (
    "id" TEXT NOT NULL,
    "target_amount" DOUBLE PRECISION NOT NULL,
    "raised_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fundraising_rounds_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fundraising_rounds_status_idx" ON "fundraising_rounds"("status");

CREATE TABLE "investor_commitments" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'interested',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_commitments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "investor_commitments_round_id_idx" ON "investor_commitments"("round_id");
CREATE INDEX "investor_commitments_investor_id_idx" ON "investor_commitments"("investor_id");
CREATE INDEX "investor_commitments_status_idx" ON "investor_commitments"("status");

ALTER TABLE "investor_commitments" ADD CONSTRAINT "investor_commitments_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "fundraising_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "investor_commitments" ADD CONSTRAINT "investor_commitments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "fundraising_investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
