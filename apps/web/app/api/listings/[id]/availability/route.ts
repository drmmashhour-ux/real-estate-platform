import { getListingAvailability } from "@/lib/booking/availability";
import { availabilityUrgencyMessage } from "@/lib/booking/availability-core";

export const dynamic = "force-dynamic";

/**
 * Order A.1 — real booking-derived availability; urgency copy only when rate thresholds are met.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }
  const a = await getListingAvailability(id);
  return Response.json(
    {
      totalBookedDays: a.totalBookedDays,
      nextAvailableDate: a.nextAvailableDate ? a.nextAvailableDate.toISOString() : null,
      occupancyRate: a.occupancyRate,
      urgency: availabilityUrgencyMessage(a.occupancyRate),
    },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  );
}
