-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "dm_status" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN "last_dm_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Lead_dm_status_idx" ON "Lead"("dm_status");

-- CreateIndex
CREATE INDEX "Lead_last_dm_at_idx" ON "Lead"("last_dm_at");
