-- CreateTable
CREATE TABLE "viral_short_script_records" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "topic" TEXT NOT NULL,
    "hook_type" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "primary_platform" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "demo_idea" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "platform_notes" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "watch_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "viral_short_script_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "viral_short_script_records_created_by_id_idx" ON "viral_short_script_records"("created_by_id");

-- CreateIndex
CREATE INDEX "viral_short_script_records_hook_type_idx" ON "viral_short_script_records"("hook_type");

-- CreateIndex
CREATE INDEX "viral_short_script_records_content_type_idx" ON "viral_short_script_records"("content_type");

-- CreateIndex
CREATE INDEX "viral_short_script_records_created_at_idx" ON "viral_short_script_records"("created_at");

-- AddForeignKey
ALTER TABLE "viral_short_script_records" ADD CONSTRAINT "viral_short_script_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
