import { NextRequest } from "next/server";
import { computeBookingPricing } from "@/lib/bnhub/booking-pricing";
import type { SelectedAddonInput } from "@/lib/bnhub/hospitality-addons";

/** GET /api/bnhub/pricing/breakdown?listingId=&checkIn=&checkOut=&guestCount=&services= — Full price breakdown for display/checkout. `services` = JSON array of { listingServiceId, quantity }. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guestCountRaw = searchParams.get("guestCount");
    const servicesRaw = searchParams.get("services");
    if (!listingId || !checkIn || !checkOut) {
      return Response.json(
        { error: "listingId, checkIn, checkOut required" },
        { status: 400 }
      );
    }
    let selectedAddons: SelectedAddonInput[] | undefined;
    if (servicesRaw) {
      try {
        const parsed = JSON.parse(servicesRaw) as unknown;
        if (!Array.isArray(parsed)) throw new Error("not array");
        selectedAddons = parsed
          .map((x) => x as { listingServiceId?: string; quantity?: number })
          .filter((x) => typeof x.listingServiceId === "string" && typeof x.quantity === "number")
          .map((x) => ({
            listingServiceId: x.listingServiceId!,
            quantity: Math.max(1, Math.floor(x.quantity!)),
          }));
      } catch {
        return Response.json({ error: "Invalid services JSON" }, { status: 400 });
      }
    }
    const guestCount =
      guestCountRaw != null ? Math.max(1, Math.min(50, parseInt(guestCountRaw, 10) || 0)) : undefined;

    const result = await computeBookingPricing({
      listingId,
      checkIn,
      checkOut,
      guestCount: guestCount && guestCount > 0 ? guestCount : undefined,
      selectedAddons,
    });
    if (!result) {
      return Response.json({ error: "Listing not found or invalid dates" }, { status: 404 });
    }
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to compute pricing" }, { status: 500 });
  }
}
