-- Optional performance layer for Supabase / Postgres (run manually or via cron).
-- Refresh after bulk TrustGraph updates: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trust_listing_score_summary;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trust_listing_score_summary AS
SELECT
  vc.entity_id AS listing_id,
  vc.id AS case_id,
  vc.overall_score,
  vc.trust_level::text AS trust_level,
  vc.readiness_level::text AS readiness_level,
  vc.updated_at
FROM verification_cases vc
WHERE vc.entity_type::text = 'LISTING';

CREATE UNIQUE INDEX IF NOT EXISTS mv_trust_listing_score_summary_listing_id_idx
  ON mv_trust_listing_score_summary (listing_id);

COMMENT ON MATERIALIZED VIEW mv_trust_listing_score_summary IS 'Snapshot of latest LISTING cases; refresh on a schedule — app still reads live verification_cases.';
