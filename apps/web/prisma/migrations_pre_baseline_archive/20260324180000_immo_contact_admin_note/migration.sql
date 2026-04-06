-- AlterTable
ALTER TABLE "immo_contact_logs" ADD COLUMN     "admin_note" TEXT,
ADD COLUMN     "admin_noted_at" TIMESTAMP(3),
ADD COLUMN     "admin_noted_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "immo_contact_logs" ADD CONSTRAINT "immo_contact_logs_admin_noted_by_id_fkey" FOREIGN KEY ("admin_noted_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
