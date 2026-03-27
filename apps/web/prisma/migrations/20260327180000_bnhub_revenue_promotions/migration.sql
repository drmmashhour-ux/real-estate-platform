-- CreateTable
CREATE TABLE "bnhub_promotion_plans" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "billing_period" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cad',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bnhub_promotion_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_promotion_orders" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "payer_user_id" TEXT NOT NULL,
    "short_term_listing_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "platform_payment_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bnhub_promotion_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_sales_assist_entries" (
    "id" TEXT NOT NULL,
    "guest_user_id" TEXT,
    "guest_email" TEXT,
    "assigned_to_user_id" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "next_follow_up_at" TIMESTAMPTZ(6),
    "converted_booking_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bnhub_sales_assist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_automation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "trigger" TEXT NOT NULL,
    "booking_id" TEXT,
    "dedupe_key" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_automation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_promotion_plans_sku_key" ON "bnhub_promotion_plans"("sku");

-- CreateIndex
CREATE INDEX "bnhub_promotion_plans_placement_idx" ON "bnhub_promotion_plans"("placement");

-- CreateIndex
CREATE INDEX "bnhub_promotion_plans_active_idx" ON "bnhub_promotion_plans"("active");

-- CreateIndex
CREATE INDEX "bnhub_promotion_orders_plan_id_idx" ON "bnhub_promotion_orders"("plan_id");

-- CreateIndex
CREATE INDEX "bnhub_promotion_orders_payer_user_id_idx" ON "bnhub_promotion_orders"("payer_user_id");

-- CreateIndex
CREATE INDEX "bnhub_promotion_orders_status_idx" ON "bnhub_promotion_orders"("status");

-- CreateIndex
CREATE INDEX "bnhub_promotion_orders_end_at_idx" ON "bnhub_promotion_orders"("end_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_sales_assist_entries_converted_booking_id_key" ON "bnhub_sales_assist_entries"("converted_booking_id");

-- CreateIndex
CREATE INDEX "bnhub_sales_assist_entries_stage_idx" ON "bnhub_sales_assist_entries"("stage");

-- CreateIndex
CREATE INDEX "bnhub_sales_assist_entries_next_follow_up_at_idx" ON "bnhub_sales_assist_entries"("next_follow_up_at");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_automation_events_dedupe_key_key" ON "bnhub_automation_events"("dedupe_key");

-- CreateIndex
CREATE INDEX "bnhub_automation_events_user_id_idx" ON "bnhub_automation_events"("user_id");

-- CreateIndex
CREATE INDEX "bnhub_automation_events_trigger_idx" ON "bnhub_automation_events"("trigger");

-- CreateIndex
CREATE INDEX "bnhub_automation_events_created_at_idx" ON "bnhub_automation_events"("created_at");

-- AddForeignKey
ALTER TABLE "bnhub_promotion_orders" ADD CONSTRAINT "bnhub_promotion_orders_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "bnhub_promotion_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_promotion_orders" ADD CONSTRAINT "bnhub_promotion_orders_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_promotion_orders" ADD CONSTRAINT "bnhub_promotion_orders_short_term_listing_id_fkey" FOREIGN KEY ("short_term_listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_sales_assist_entries" ADD CONSTRAINT "bnhub_sales_assist_entries_guest_user_id_fkey" FOREIGN KEY ("guest_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_sales_assist_entries" ADD CONSTRAINT "bnhub_sales_assist_entries_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_sales_assist_entries" ADD CONSTRAINT "bnhub_sales_assist_entries_converted_booking_id_fkey" FOREIGN KEY ("converted_booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_automation_events" ADD CONSTRAINT "bnhub_automation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
