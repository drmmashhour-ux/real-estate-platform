-- AlterTable: email verification for self-serve client signup (USER role).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verification_token" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verification_expires" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_verification_token_key" ON "User"("email_verification_token");

-- Existing accounts: treat as already verified so login keeps working.
UPDATE "User" SET "email_verified_at" = "createdAt" WHERE "email_verified_at" IS NULL;
