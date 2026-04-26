-- AlterTable
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "whatsapp_clicks" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "phone_clicks" INTEGER NOT NULL DEFAULT 0;
