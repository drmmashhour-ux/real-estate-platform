-- CreateTable
CREATE TABLE "avatar_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "video_base_url" TEXT NOT NULL,
    "voice_profile_id" TEXT,
    "style_config" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_user_explainer_media" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "video_url" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_user_explainer_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "avatar_profiles_active_idx" ON "avatar_profiles"("active");

-- CreateIndex
CREATE UNIQUE INDEX "lecipm_user_explainer_media_user_id_key" ON "lecipm_user_explainer_media"("user_id");

-- AddForeignKey
ALTER TABLE "lecipm_user_explainer_media" ADD CONSTRAINT "lecipm_user_explainer_media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
