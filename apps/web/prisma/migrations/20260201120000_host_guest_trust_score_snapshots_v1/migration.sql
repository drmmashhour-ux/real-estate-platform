-- LECIPM Final Hardening v1 — optional append-only host/guest trust audit rows (not used for runtime reads).
CREATE TABLE "host_trust_score_snapshots" (
    "id" TEXT NOT NULL,
    "host_user_id" TEXT NOT NULL,
    "trust_score" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_trust_score_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "host_trust_score_snapshots_host_user_id_created_at_idx" ON "host_trust_score_snapshots"("host_user_id", "created_at");

ALTER TABLE "host_trust_score_snapshots" ADD CONSTRAINT "host_trust_score_snapshots_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "guest_trust_score_snapshots" (
    "id" TEXT NOT NULL,
    "guest_user_id" TEXT NOT NULL,
    "trust_score" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_trust_score_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "guest_trust_score_snapshots_guest_user_id_created_at_idx" ON "guest_trust_score_snapshots"("guest_user_id", "created_at");

ALTER TABLE "guest_trust_score_snapshots" ADD CONSTRAINT "guest_trust_score_snapshots_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
