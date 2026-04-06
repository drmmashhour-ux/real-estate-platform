-- A/B variants on marketing content + email opens on metrics

ALTER TABLE "marketing_content" ADD COLUMN "parent_content_id" TEXT,
ADD COLUMN "variant_label" TEXT,
ADD COLUMN "is_variant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "is_winner_variant" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "marketing_content_parent_content_id_idx" ON "marketing_content"("parent_content_id");

ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_parent_content_id_fkey" FOREIGN KEY ("parent_content_id") REFERENCES "marketing_content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "marketing_metrics" ADD COLUMN "opens" INTEGER;
