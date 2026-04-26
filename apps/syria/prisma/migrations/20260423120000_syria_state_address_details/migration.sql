-- AlterTable
ALTER TABLE "syria_properties" ADD COLUMN "state" TEXT NOT NULL DEFAULT '';
ALTER TABLE "syria_properties" ADD COLUMN "address_details" TEXT;

-- CreateIndex
CREATE INDEX "syria_properties_state_idx" ON "syria_properties"("state");
