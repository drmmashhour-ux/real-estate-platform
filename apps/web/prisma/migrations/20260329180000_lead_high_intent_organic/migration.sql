-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "high_intent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Lead_high_intent_idx" ON "Lead"("high_intent");
