import { NextRequest } from "next/server";
import { searchQuerySuggestions } from "@/lib/ai/search-autocomplete";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/search/suggest?q= — public autocomplete (no PII stored).
 */
export async function GET(request: NextRequest) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 200);
  const limit = Math.min(12, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 8));
  const suggestions = searchQuerySuggestions(q, limit);
  return Response.json({ suggestions, disclaimer: "Static + prefix rules — not personalized." });
}
