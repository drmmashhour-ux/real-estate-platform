-- ImmoContact compliance event log (views, messages, booking requests)

CREATE TYPE "ImmoContactEventType" AS ENUM ('VIEW', 'CONTACT_CLICK', 'MESSAGE', 'CALL', 'BOOKING_REQUEST');

CREATE TABLE "immo_contact_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "listing_id" TEXT,
    "listing_kind" TEXT,
    "contact_type" "ImmoContactEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "immo_contact_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "immo_contact_logs_user_id_idx" ON "immo_contact_logs"("user_id");
CREATE INDEX "immo_contact_logs_listing_id_idx" ON "immo_contact_logs"("listing_id");
CREATE INDEX "immo_contact_logs_contact_type_idx" ON "immo_contact_logs"("contact_type");
CREATE INDEX "immo_contact_logs_created_at_idx" ON "immo_contact_logs"("created_at");

ALTER TABLE "immo_contact_logs" ADD CONSTRAINT "immo_contact_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET ON UPDATE CASCADE;
