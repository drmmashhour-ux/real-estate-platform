-- LECIPM Marketing Studio v1 — user-saved canvas projects
CREATE TABLE "marketing_studio_projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL DEFAULT 'Untitled design',
    "project_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_studio_projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketing_studio_projects_user_id_updated_at_idx" ON "marketing_studio_projects"("user_id", "updated_at");

ALTER TABLE "marketing_studio_projects" ADD CONSTRAINT "marketing_studio_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
