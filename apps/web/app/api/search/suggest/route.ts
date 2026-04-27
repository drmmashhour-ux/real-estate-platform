import { flags } from "@/lib/flags";
import { getSearchSuggest } from "@/lib/search/suggestForSmartSearchBar";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const MAX_Q = 200;

/**
 * GET /api/search/suggest?q=…&prefCities=Montréal,Québec
 * Returns cities + stay listings (BNHub) for the smart search bar. No third-party calls.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!flags.RECOMMENDATIONS) {
    return Response.json(
      { cities: [], listings: [], disabled: true },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { searchParams } = new URL(req.url);
  const qRaw = searchParams.get("q") ?? "";
  const q = qRaw.length > MAX_Q ? qRaw.slice(0, MAX_Q) : qRaw;
  const pref = searchParams.get("prefCities");
  const preferredCities =
    pref
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  if (q.trim().length === 0) {
    return Response.json({ cities: [], listings: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { cities, listings } = await getSearchSuggest(q, preferredCities);
    return Response.json(
      { cities, listings },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" } }
    );
  } catch (e) {
    logError(e, { route: "/api/search/suggest" });
    return Response.json({ error: "Suggest failed" }, { status: 500 });
  }
}
