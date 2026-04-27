-- Append-only SYBNB financial audit (SyriaBooking path)
CREATE TABLE "syria_sybnb_core_audit" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT,
    "event" TEXT NOT NULL,
    "provider" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "syria_sybnb_core_audit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "syria_sybnb_core_audit_booking_id_idx" ON "syria_sybnb_core_audit"("booking_id");
CREATE INDEX "syria_sybnb_core_audit_event_created_at_idx" ON "syria_sybnb_core_audit"("event", "created_at");
ALTER TABLE "syria_sybnb_core_audit" ADD CONSTRAINT "syria_sybnb_core_audit_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "syria_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
