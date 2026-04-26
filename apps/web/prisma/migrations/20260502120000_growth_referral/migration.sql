-- Order 47 — referral tracking (lib/growth/referral.ts)
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid()::text),
    "code" TEXT NOT NULL,
    "newUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Referral_newUserId_key" UNIQUE ("newUserId")
);

CREATE INDEX "Referral_code_idx" ON "Referral"("code");

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_newUserId_fkey" FOREIGN KEY ("newUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
