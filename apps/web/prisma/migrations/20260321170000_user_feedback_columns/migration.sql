-- User feedback: optional user, page path, nullable message; ratings for aggregates

ALTER TABLE "user_feedback" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
ALTER TABLE "user_feedback" ADD COLUMN IF NOT EXISTS "page" TEXT;

ALTER TABLE "user_feedback" ALTER COLUMN "message" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_feedback_user_id_fkey'
  ) THEN
    ALTER TABLE "user_feedback"
      ADD CONSTRAINT "user_feedback_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "user_feedback_user_id_idx" ON "user_feedback"("user_id");
CREATE INDEX IF NOT EXISTS "user_feedback_rating_idx" ON "user_feedback"("rating");
