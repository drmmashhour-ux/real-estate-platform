-- In-platform SYBNB booking messages (guest/host only via API).
CREATE TABLE "sybnb_messages" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sybnb_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sybnb_messages_booking_id_idx" ON "sybnb_messages"("booking_id");

CREATE INDEX "sybnb_messages_booking_id_created_at_idx" ON "sybnb_messages"("booking_id", "created_at");

ALTER TABLE "sybnb_messages" ADD CONSTRAINT "sybnb_messages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "sybnb_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sybnb_messages" ADD CONSTRAINT "sybnb_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "syria_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
