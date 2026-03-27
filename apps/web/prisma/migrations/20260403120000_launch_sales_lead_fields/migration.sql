-- Launch & sales tracking on CRM leads
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "launch_sales_contacted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "launch_last_contact_date" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "launch_notes" TEXT;
