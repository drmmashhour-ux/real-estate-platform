-- CreateTable
CREATE TABLE IF NOT EXISTS "growth_waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "growth_waitlist_email_key" ON "growth_waitlist"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "growth_waitlist_created_at_idx" ON "growth_waitlist"("created_at");
