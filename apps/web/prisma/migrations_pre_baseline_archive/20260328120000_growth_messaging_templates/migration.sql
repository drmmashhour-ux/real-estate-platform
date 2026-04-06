-- Growth messaging: templates, logs, user outreach fields

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "growth_outreach_segment" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "growth_last_contact_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "growth_follow_up_due_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "growth_follow_up_sent_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "growth_messaging_paused" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "message_templates" (
    "id" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "message_templates_segment_type_idx" ON "message_templates"("segment", "type");

CREATE TABLE IF NOT EXISTS "message_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "subject" TEXT,
    "body_preview" TEXT,
    "trigger_event" TEXT,
    "metadata" JSONB,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "message_logs_user_id_sent_at_idx" ON "message_logs"("user_id", "sent_at");
CREATE INDEX IF NOT EXISTS "message_logs_status_idx" ON "message_logs"("status");

ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
