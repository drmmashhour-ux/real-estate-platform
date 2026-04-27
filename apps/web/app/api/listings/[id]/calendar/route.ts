import { CACHE_KEYS, getCached } from "@/lib/cache";
import { getListingDailyCalendar } from "@/lib/booking/dailyCalendar";
import { validateListingCalendarQuery } from "@/lib/booking/dailyCalendarQuery";
import { getListingsDB } from "@/lib/db/routeSwitch";
import { isDemoDataActive, isDemoListingId, parseDemoScenarioFromRequest } from "@/lib/demo/mode";
import { getDemoCalendar } from "@/lib/demo/data";

export const dynamic = "force-dynamic";

/**
 * Order A.2 — daily availability + suggested price + heatmap level (no per-day SQL).
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return Response.json({ error: "listing id required" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const v = validateListingCalendarQuery(searchParams.get("start"), searchParams.get("end"));
  if (!v.ok) {
    return Response.json({ error: v.err.error }, { status: v.err.status });
  }

  if (isDemoDataActive(req) && isDemoListingId(id)) {
    const days = getDemoCalendar(id.trim(), v.startYmd, v.endYmd, parseDemoScenarioFromRequest(req));
    return Response.json(
      { days, demo: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const db = getListingsDB();
  const listing = await db.listing.findUnique({ where: { id: id.trim() }, select: { id: true } });
  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const days = await getCached(
    CACHE_KEYS.availability(id.trim(), v.startYmd, v.endYmd),
    15,
    () => getListingDailyCalendar(id.trim(), v.startYmd, v.endYmd)
  );
  return Response.json(
    { days },
    { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" } }
  );
}
