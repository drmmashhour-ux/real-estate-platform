-- Content & Usage License policy + per-user acceptance
CREATE TABLE IF NOT EXISTS "content_license_policy" (
    "id" TEXT NOT NULL,
    "current_version" TEXT NOT NULL DEFAULT '1.0.0',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_user_id" TEXT,

    CONSTRAINT "content_license_policy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "content_license_acceptances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_license_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "content_license_acceptances_user_id_key" ON "content_license_acceptances"("user_id");
CREATE INDEX IF NOT EXISTS "content_license_acceptances_user_id_idx" ON "content_license_acceptances"("user_id");

ALTER TABLE "content_license_acceptances" ADD CONSTRAINT "content_license_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_license_policy" ADD CONSTRAINT "content_license_policy_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "content_license_policy" ("id", "current_version", "updated_at")
VALUES ('global', '1.0.0', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
