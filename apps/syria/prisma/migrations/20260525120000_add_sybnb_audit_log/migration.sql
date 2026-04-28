-- Append-only SYBNB booking lifecycle audit (API routes only; no updates/deletes).
CREATE TABLE "sybnb_audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "booking_id" TEXT,
    "user_id" TEXT,
    "actor_role" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sybnb_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sybnb_audit_log_booking_id_idx" ON "sybnb_audit_log"("booking_id");

CREATE INDEX "sybnb_audit_log_user_id_idx" ON "sybnb_audit_log"("user_id");
