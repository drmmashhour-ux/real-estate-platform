-- Investment MVP: server-tracked analyze counts + waitlist early_user tags
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "investment_mvp_analyze_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "investment_mvp_first_analyze_at" TIMESTAMP(3);

ALTER TABLE "waitlist_users" ADD COLUMN IF NOT EXISTS "tags" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "waitlist_users" ADD COLUMN IF NOT EXISTS "early_user_tagged_at" TIMESTAMP(3);
