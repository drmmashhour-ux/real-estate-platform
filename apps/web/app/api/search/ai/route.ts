import { runAiListingSearch } from "@/lib/search/run-ai-search";

export const dynamic = "force-dynamic";

/**
 * POST /api/search/ai — natural language listing search (platform-owned parsing + ranking).
 * Body: `{ "query": "2 bedroom Montreal under 250" }`
 */
export async function POST(request: Request) {
  let body: { query?: string };
  try {
    body = (await request.json()) as { query?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const q = typeof body.query === "string" ? body.query.trim() : "";
  if (!q) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  const result = await runAiListingSearch(q);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({
    parsed: result.data.parsed,
    listings: result.data.results.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      city: r.city,
      price_per_night: r.price_per_night,
      cover_image_url: r.cover_image_url,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      score: r.score,
      reasons: r.reasons,
    })),
  });
}
