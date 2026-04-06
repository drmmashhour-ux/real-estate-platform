-- LECIPM equity: holders, grants, vesting

CREATE TABLE "equity_holders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "equity_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equity_holders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "equity_holders_role_idx" ON "equity_holders"("role");

CREATE TABLE "equity_grants" (
    "id" TEXT NOT NULL,
    "holder_id" TEXT NOT NULL,
    "total_shares" DOUBLE PRECISION NOT NULL,
    "vesting_start" TIMESTAMP(3) NOT NULL,
    "vesting_duration" INTEGER NOT NULL,
    "cliff_months" INTEGER NOT NULL,
    "vested_shares" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equity_grants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "equity_grants_holder_id_idx" ON "equity_grants"("holder_id");

ALTER TABLE "equity_grants" ADD CONSTRAINT "equity_grants_holder_id_fkey" FOREIGN KEY ("holder_id") REFERENCES "equity_holders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
