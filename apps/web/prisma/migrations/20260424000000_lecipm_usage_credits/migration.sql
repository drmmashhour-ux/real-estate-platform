-- LECIPM First Revenue Engine — per-user balance for paid turbo contract PDF exports.
CREATE TABLE "usage_credits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_credits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "usage_credits_user_id_key" ON "usage_credits"("user_id");

ALTER TABLE "usage_credits" ADD CONSTRAINT "usage_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
