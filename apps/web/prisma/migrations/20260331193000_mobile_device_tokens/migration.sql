CREATE TABLE "mobile_device_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'expo',
    "device_name" TEXT,
    "app_version" TEXT,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_device_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mobile_device_tokens_token_key" ON "mobile_device_tokens"("token");
CREATE INDEX "mobile_device_tokens_user_id_idx" ON "mobile_device_tokens"("user_id");
CREATE INDEX "mobile_device_tokens_platform_idx" ON "mobile_device_tokens"("platform");
CREATE INDEX "mobile_device_tokens_provider_idx" ON "mobile_device_tokens"("provider");
CREATE INDEX "mobile_device_tokens_revoked_at_idx" ON "mobile_device_tokens"("revoked_at");

ALTER TABLE "mobile_device_tokens"
ADD CONSTRAINT "mobile_device_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
