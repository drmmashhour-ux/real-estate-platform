-- Order 59 — weights on `experiment_variants` + idempotent `hero_cta_copy` (draft) + variants

ALTER TABLE "experiment_variants" ADD COLUMN IF NOT EXISTS "weight" INTEGER;

INSERT INTO "experiments" (
  "id",
  "name",
  "slug",
  "status",
  "target_surface",
  "primary_metric",
  "traffic_split_json",
  "created_at",
  "updated_at",
  "stopped_variant_keys"
)
SELECT
  gen_random_uuid()::text,
  'Hero CTA copy',
  'hero_cta_copy',
  'draft'::"ExperimentStatus",
  'marketing_hero',
  'signup_completed',
  '{"A":50,"B":50}'::jsonb,
  NOW(),
  NOW(),
  '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "experiments" WHERE "slug" = 'hero_cta_copy');

INSERT INTO "experiment_variants" (
  "id",
  "experiment_id",
  "variant_key",
  "name",
  "config_json",
  "weight",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  e."id",
  'A',
  'Explore listings',
  '{}'::jsonb,
  50,
  NOW(),
  NOW()
FROM "experiments" e
WHERE e."slug" = 'hero_cta_copy'
  AND NOT EXISTS (SELECT 1 FROM "experiment_variants" v WHERE v."experiment_id" = e."id" AND v."variant_key" = 'A');

INSERT INTO "experiment_variants" (
  "id",
  "experiment_id",
  "variant_key",
  "name",
  "config_json",
  "weight",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  e."id",
  'B',
  'Find your next home',
  '{}'::jsonb,
  50,
  NOW(),
  NOW()
FROM "experiments" e
WHERE e."slug" = 'hero_cta_copy'
  AND NOT EXISTS (SELECT 1 FROM "experiment_variants" v WHERE v."experiment_id" = e."id" AND v."variant_key" = 'B');
