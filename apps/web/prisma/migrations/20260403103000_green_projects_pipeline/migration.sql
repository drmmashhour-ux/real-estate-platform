-- Green upgrade pipeline project tracking (per FSBO listing)

CREATE TABLE "green_projects" (
    "id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "stage" VARCHAR(24) NOT NULL DEFAULT 'ANALYSIS',
    "estimated_grant" DOUBLE PRECISION,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "green_projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "green_projects_fsbo_listing_id_key" ON "green_projects"("fsbo_listing_id");

ALTER TABLE "green_projects" ADD CONSTRAINT "green_projects_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
