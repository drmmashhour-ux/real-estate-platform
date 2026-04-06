-- Align User with Prisma: Connect capability snapshot fields used by BNHub checkout / payouts.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripe_charges_enabled" BOOLEAN;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripe_payouts_enabled" BOOLEAN;
