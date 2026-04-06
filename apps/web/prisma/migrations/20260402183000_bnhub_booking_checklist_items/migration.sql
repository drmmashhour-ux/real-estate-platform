-- BNHub arrival trust checklist per booking
CREATE TABLE "bnhub_booking_checklist_items" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "item_key" TEXT NOT NULL,
    "label" TEXT,
    "expected" BOOLEAN NOT NULL DEFAULT true,
    "confirmed" BOOLEAN,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_booking_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_booking_checklist_items_booking_id_item_key_key" ON "bnhub_booking_checklist_items"("booking_id", "item_key");

CREATE INDEX "bnhub_booking_checklist_items_booking_id_idx" ON "bnhub_booking_checklist_items"("booking_id");

ALTER TABLE "bnhub_booking_checklist_items" ADD CONSTRAINT "bnhub_booking_checklist_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
