-- S3: append-only payment audit log (confirm/reject/create tracking).
CREATE TABLE IF NOT EXISTS "syria_payment_audit_log" (
    "id" TEXT NOT NULL,
    "request_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "admin_id" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "syria_payment_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "syria_payment_audit_log_request_id_idx" ON "syria_payment_audit_log"("request_id");
CREATE INDEX IF NOT EXISTS "syria_payment_audit_log_created_at_idx" ON "syria_payment_audit_log"("created_at");

ALTER TABLE "syria_payment_audit_log" ADD CONSTRAINT "syria_payment_audit_log_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "syria_payment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
