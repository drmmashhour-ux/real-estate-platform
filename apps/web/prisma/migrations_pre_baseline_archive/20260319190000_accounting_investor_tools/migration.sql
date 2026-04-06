-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" TEXT NOT NULL,
    "entry_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source_type" TEXT,
    "source_id" TEXT,
    "subtotal_cents" INTEGER NOT NULL DEFAULT 0,
    "gst_cents" INTEGER NOT NULL DEFAULT 0,
    "qst_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_records" (
    "id" TEXT NOT NULL,
    "accounting_entry_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "welcome_tax_municipality_configs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brackets_json" JSONB NOT NULL,
    "rebate_rules_json" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "welcome_tax_municipality_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incentive_program_configs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "external_link" TEXT,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incentive_program_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_usage_events" (
    "id" TEXT NOT NULL,
    "tool_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL DEFAULT 'view',
    "city" TEXT,
    "user_id" TEXT,
    "payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounting_entries_entry_type_idx" ON "accounting_entries"("entry_type");

-- CreateIndex
CREATE INDEX "accounting_entries_category_idx" ON "accounting_entries"("category");

-- CreateIndex
CREATE INDEX "accounting_entries_entry_date_idx" ON "accounting_entries"("entry_date");

-- CreateIndex
CREATE INDEX "accounting_entries_status_idx" ON "accounting_entries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliation_records_accounting_entry_id_key" ON "reconciliation_records"("accounting_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "welcome_tax_municipality_configs_slug_key" ON "welcome_tax_municipality_configs"("slug");

-- CreateIndex
CREATE INDEX "incentive_program_configs_active_idx" ON "incentive_program_configs"("active");

-- CreateIndex
CREATE INDEX "tool_usage_events_tool_key_idx" ON "tool_usage_events"("tool_key");

-- CreateIndex
CREATE INDEX "tool_usage_events_created_at_idx" ON "tool_usage_events"("created_at");

-- AddForeignKey
ALTER TABLE "reconciliation_records" ADD CONSTRAINT "reconciliation_records_accounting_entry_id_fkey" FOREIGN KEY ("accounting_entry_id") REFERENCES "accounting_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
