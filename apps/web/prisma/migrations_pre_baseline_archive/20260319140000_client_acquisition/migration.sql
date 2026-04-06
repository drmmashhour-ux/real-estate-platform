-- CreateTable
CREATE TABLE "client_acquisition_leads" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'facebook',
    "phone" TEXT,
    "notes" TEXT,
    "message_sent" BOOLEAN NOT NULL DEFAULT false,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "interested" BOOLEAN NOT NULL DEFAULT false,
    "call_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "message_sent_at" TIMESTAMP(3),
    "replied_at" TIMESTAMP(3),
    "interested_at" TIMESTAMP(3),
    "call_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "service_type" TEXT,
    "value_cents" INTEGER,
    "revenue_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_acquisition_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_acquisition_daily_progress" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "contacts_count" INTEGER NOT NULL DEFAULT 0,
    "leads_count" INTEGER NOT NULL DEFAULT 0,
    "calls_booked_count" INTEGER NOT NULL DEFAULT 0,
    "clients_closed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_acquisition_daily_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_acquisition_leads_owner_id_idx" ON "client_acquisition_leads"("owner_id");

-- CreateIndex
CREATE INDEX "client_acquisition_leads_owner_id_closed_idx" ON "client_acquisition_leads"("owner_id", "closed");

-- CreateIndex
CREATE INDEX "client_acquisition_leads_owner_id_created_at_idx" ON "client_acquisition_leads"("owner_id", "created_at");

-- CreateIndex
CREATE INDEX "client_acquisition_daily_progress_owner_id_idx" ON "client_acquisition_daily_progress"("owner_id");

-- CreateIndex
CREATE INDEX "client_acquisition_daily_progress_date_idx" ON "client_acquisition_daily_progress"("date");

-- CreateIndex
CREATE UNIQUE INDEX "client_acquisition_daily_progress_owner_id_date_key" ON "client_acquisition_daily_progress"("owner_id", "date");

-- AddForeignKey
ALTER TABLE "client_acquisition_leads" ADD CONSTRAINT "client_acquisition_leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_acquisition_daily_progress" ADD CONSTRAINT "client_acquisition_daily_progress_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
