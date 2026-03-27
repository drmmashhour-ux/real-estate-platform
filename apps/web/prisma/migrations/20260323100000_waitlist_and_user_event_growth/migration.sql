-- CreateTable
CREATE TABLE "waitlist_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "waitlist_users_email_key" ON "waitlist_users"("email");
CREATE INDEX "waitlist_users_created_at_idx" ON "waitlist_users"("created_at");

-- AlterEnum (PostgreSQL) — safe if re-applied
DO $$ BEGIN
  ALTER TYPE "UserEventType" ADD VALUE 'WAITLIST_SIGNUP';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE "UserEventType" ADD VALUE 'RETURN_VISIT';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
