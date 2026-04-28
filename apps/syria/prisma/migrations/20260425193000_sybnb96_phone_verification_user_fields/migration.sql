-- ORDER SYBNB-96 — SyriaAppUser phone verification flags + pending OTP storage

ALTER TABLE "syria_users" ADD COLUMN "phone_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "syria_users" ADD COLUMN "phone_code" TEXT;
ALTER TABLE "syria_users" ADD COLUMN "phone_code_expiry" TIMESTAMP(3);

UPDATE "syria_users" SET "phone_verified" = true WHERE "phone_verified_at" IS NOT NULL;
