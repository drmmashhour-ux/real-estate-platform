-- Order 53 — User.lastActiveAt for retention SQL (lib/retention/engine.ts)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "User_last_active_at_idx" ON "User"("last_active_at");

-- Order 56 — in-app feedback log (lib/feedback/system.ts)
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid()::text),
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
