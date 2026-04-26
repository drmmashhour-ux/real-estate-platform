import { rankBySearchRelevance, type SearchableListing } from "@/lib/ai/searchRelevance";
import { query } from "@/lib/sql";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const LIMIT = 200;

type Row = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  propertyType: string | null;
  rating: string | number | null;
  trustScore: string | number | null;
};

/**
 * GET /api/search/relevance?q=… — re-rank published BNHub stays by intent + static quality signals.
 * Uses `bnhub_listings` (not a generic `Listing` table); `active` is approximated with `PUBLISHED`.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const raw = await query<Row>(
    `SELECT
       l."id",
       l."title",
       l."description",
       l."city",
       l."property_type" AS "propertyType",
       l."bnhub_listing_rating_average" AS "rating",
       COALESCE(lqs."trust_score", l."ai_discovery_score", 0) AS "trustScore"
     FROM "bnhub_listings" l
     LEFT JOIN "listing_quality_scores" lqs ON lqs."listing_id" = l."id"
     WHERE l."listing_status" = 'PUBLISHED'
     LIMIT $1`,
    [LIMIT]
  );

  const listings: Array<SearchableListing & { id: string }> = raw.map((r) => {
    const rating =
      r.rating == null || r.rating === "" ? null : typeof r.rating === "string" ? parseFloat(r.rating) : r.rating;
    const trustScore =
      r.trustScore == null || r.trustScore === "" ? null : typeof r.trustScore === "string" ? parseFloat(r.trustScore) : r.trustScore;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      city: r.city,
      propertyType: r.propertyType,
      rating: rating != null && Number.isFinite(rating) ? rating : null,
      trustScore: trustScore != null && Number.isFinite(trustScore) ? trustScore : null,
    };
  });

  return Response.json({
    q,
    cap: LIMIT,
    items: rankBySearchRelevance(q, listings),
  });
}
