-- LECIPM revenue execution: daily discipline + CRM-tagged actions

CREATE TABLE "revenue_execution_days" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "brokers_contacted" INTEGER NOT NULL DEFAULT 0,
    "hosts_contacted" INTEGER NOT NULL DEFAULT 0,
    "inquiries_generated" INTEGER NOT NULL DEFAULT 0,
    "bookings_completed" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_execution_days_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "revenue_execution_days_date_key" ON "revenue_execution_days"("date");
CREATE INDEX "revenue_execution_days_date_idx" ON "revenue_execution_days"("date");

CREATE TABLE "revenue_execution_actions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'done',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_execution_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "revenue_execution_actions_user_id_created_at_idx" ON "revenue_execution_actions"("user_id", "created_at");
CREATE INDEX "revenue_execution_actions_type_created_at_idx" ON "revenue_execution_actions"("type", "created_at");

ALTER TABLE "revenue_execution_actions" ADD CONSTRAINT "revenue_execution_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
