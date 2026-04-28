-- SYBNB cron reminders: approval timestamp + append-only delivery log
ALTER TABLE "sybnb_bookings" ADD COLUMN "approved_at" TIMESTAMP(3);

CREATE INDEX "sybnb_bookings_approved_at_idx" ON "sybnb_bookings"("approved_at");

CREATE TABLE "sybnb_reminder_log" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sybnb_reminder_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sybnb_reminder_log_booking_reminder_recipient_sent_idx" ON "sybnb_reminder_log"("booking_id", "reminder_type", "recipient_user_id", "sent_at");

ALTER TABLE "sybnb_reminder_log" ADD CONSTRAINT "sybnb_reminder_log_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "sybnb_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sybnb_reminder_log" ADD CONSTRAINT "sybnb_reminder_log_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "syria_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
