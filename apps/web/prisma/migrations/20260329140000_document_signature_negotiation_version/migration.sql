-- AlterTable
ALTER TABLE "document_signatures" ADD COLUMN "negotiation_version_id" TEXT;

-- CreateIndex
CREATE INDEX "document_signatures_negotiation_version_id_idx" ON "document_signatures"("negotiation_version_id");

-- AddForeignKey
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_negotiation_version_id_fkey" FOREIGN KEY ("negotiation_version_id") REFERENCES "negotiation_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
