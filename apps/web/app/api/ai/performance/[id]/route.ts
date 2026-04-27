import { getGuestId } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { loadListingPerformance } from "@/lib/ai/performance";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (isDemoMode) {
    return Response.json({
      ok: true,
      demo: true,
      listing: { id: "demo", title: "Demo", listingCode: "DEMO" },
      metrics: { bookings: 0, revenueCents: 0, revenueDollars: 0 },
      logs: [],
      impact: { priceChanges: 0, conversionHints: 0 },
      estimate: null,
    });
  }
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: listingId } = await context.params;
  if (!listingId) {
    return Response.json({ error: "Missing listing id" }, { status: 400 });
  }

  const data = await loadListingPerformance(listingId, userId);
  if (!data.ok) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(data);
}
