-- Pre–price-apply snapshots for optional rollback (additive).

CREATE TABLE "conversion_backups" (
    "id" TEXT NOT NULL,
    "listing_id" VARCHAR(32) NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_backups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "conversion_backups_listing_id_created_at_idx" ON "conversion_backups"("listing_id", "created_at");
