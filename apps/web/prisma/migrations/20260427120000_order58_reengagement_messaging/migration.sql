-- Order 58: marketing opt-in, rate-cap field, and re-engagement audit log
ALTER TABLE "User" ADD COLUMN "marketing_email_opt_in" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "marketing_sms_opt_in" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "last_reengagement_message_at" TIMESTAMP(3);

CREATE TABLE "reengagement_message_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel" VARCHAR(8) NOT NULL,
    "subject" VARCHAR(256),
    "body_preview" TEXT NOT NULL,
    "dry_run" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reengagement_message_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reengagement_message_logs_user_id_created_at_idx" ON "reengagement_message_logs"("user_id", "created_at");
CREATE INDEX "reengagement_message_logs_created_at_idx" ON "reengagement_message_logs"("created_at");

ALTER TABLE "reengagement_message_logs" ADD CONSTRAINT "reengagement_message_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
