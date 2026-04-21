-- Guided Rénoclimat assistant checklist + reminder bookkeeping (no official submission data)

CREATE TABLE "renoclimat_assistant_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "checklist_json" JSONB NOT NULL DEFAULT '{}',
    "reminders_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_reminder_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renoclimat_assistant_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "renoclimat_assistant_progress_user_id_key" ON "renoclimat_assistant_progress"("user_id");

ALTER TABLE "renoclimat_assistant_progress" ADD CONSTRAINT "renoclimat_assistant_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
