-- ORDER SYBNB-92 — seller contact preferences + nullable inquiry phone for message-only leads.

ALTER TABLE "syria_properties"
ADD COLUMN IF NOT EXISTS "contact_email" TEXT,
ADD COLUMN IF NOT EXISTS "allow_phone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "allow_whatsapp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "allow_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "allow_messages" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "syria_inquiries" ALTER COLUMN "phone" DROP NOT NULL;
