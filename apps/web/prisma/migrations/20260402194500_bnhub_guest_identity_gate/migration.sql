-- Optional host rule: require verified guest ID before booking (Prisma BNHub listings).
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "require_guest_identity_verification" BOOLEAN NOT NULL DEFAULT false;
