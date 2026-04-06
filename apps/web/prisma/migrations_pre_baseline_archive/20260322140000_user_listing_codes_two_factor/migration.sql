-- AlterTable
ALTER TABLE "User" ADD COLUMN "user_code" TEXT;
ALTER TABLE "User" ADD COLUMN "two_factor_email_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_user_code_key" ON "User"("user_code");

-- AlterTable
ALTER TABLE "fsbo_listings" ADD COLUMN "listing_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "fsbo_listings_listing_code_key" ON "fsbo_listings"("listing_code");

-- CreateTable
CREATE TABLE "two_factor_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "two_factor_codes_user_id_expires_at_idx" ON "two_factor_codes"("user_id", "expires_at");

-- AddForeignKey
ALTER TABLE "two_factor_codes" ADD CONSTRAINT "two_factor_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
