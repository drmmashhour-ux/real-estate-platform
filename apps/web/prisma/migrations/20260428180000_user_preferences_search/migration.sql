-- Additive: personalized search signals (not core business state)
CREATE TABLE IF NOT EXISTS "user_preferences" (
    "user_id" VARCHAR(36) NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "value" VARCHAR(256) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id", "key", "value")
);

CREATE INDEX IF NOT EXISTS "user_preferences_user_id_idx" ON "user_preferences"("user_id");
CREATE INDEX IF NOT EXISTS "user_preferences_key_idx" ON "user_preferences"("key");

ALTER TABLE "user_preferences"
  ADD CONSTRAINT "user_preferences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
