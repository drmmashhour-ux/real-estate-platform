-- CreateTable
CREATE TABLE "operator_waitlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "residence_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "reviewed_at" TIMESTAMP(3),
    "onboarding_sent_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operator_waitlist_city_status_idx" ON "operator_waitlist"("city", "status");

-- CreateIndex
CREATE INDEX "operator_waitlist_status_priority_idx" ON "operator_waitlist"("status", "priority" DESC);

-- CreateIndex
CREATE INDEX "operator_waitlist_created_at_idx" ON "operator_waitlist"("created_at" DESC);
