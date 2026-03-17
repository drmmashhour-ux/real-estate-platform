import { NextRequest } from "next/server";
import { computeBookingPricing } from "@/lib/bnhub/booking-pricing";

/** GET /api/bnhub/pricing/breakdown?listingId=&checkIn=&checkOut= — Full price breakdown for display/checkout. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    if (!listingId || !checkIn || !checkOut) {
      return Response.json(
        { error: "listingId, checkIn, checkOut required" },
        { status: 400 }
      );
    }
    const result = await computeBookingPricing({ listingId, checkIn, checkOut });
    if (!result) {
      return Response.json({ error: "Listing not found or invalid dates" }, { status: 404 });
    }
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to compute pricing" }, { status: 500 });
  }
}
