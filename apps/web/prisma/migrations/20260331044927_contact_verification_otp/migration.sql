-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone_verified_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "contact_verification_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel" VARCHAR(8) NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "sms_target_e164" VARCHAR(24),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_verification_codes_user_id_channel_idx" ON "contact_verification_codes"("user_id", "channel");

-- CreateIndex
CREATE INDEX "contact_verification_codes_expires_at_idx" ON "contact_verification_codes"("expires_at");

-- AddForeignKey
ALTER TABLE "contact_verification_codes" ADD CONSTRAINT "contact_verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
