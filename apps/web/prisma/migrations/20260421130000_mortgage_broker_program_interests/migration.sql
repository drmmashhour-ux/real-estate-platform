-- Mortgage broker platform: public interest submissions (no auth)
CREATE TABLE "mortgage_broker_program_interests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "plan_slug" TEXT NOT NULL,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'for-brokers',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_broker_program_interests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mortgage_broker_program_interests_created_at_idx" ON "mortgage_broker_program_interests"("created_at");
CREATE INDEX "mortgage_broker_program_interests_email_idx" ON "mortgage_broker_program_interests"("email");
CREATE INDEX "mortgage_broker_program_interests_plan_slug_idx" ON "mortgage_broker_program_interests"("plan_slug");
