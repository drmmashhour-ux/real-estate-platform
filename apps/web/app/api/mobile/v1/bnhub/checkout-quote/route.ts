import { NextRequest } from "next/server";
import {
  computeBnhubGuestCheckoutCents,
  isBnhubItemizedCheckoutEnabled,
} from "@/lib/monetization/bnhub-checkout-pricing";
import {
  amountCentsFromTotalPrice,
  fetchGuestSupabaseBookingForCheckout,
} from "@/lib/stripe/guestSupabaseBooking";

export const dynamic = "force-dynamic";

/**
 * GET — quote accommodation + dynamic fees + upsells for a Supabase booking (no Stripe session).
 */
export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("bookingId")?.trim() ?? "";
  if (!bookingId) {
    return Response.json({ error: "bookingId required" }, { status: 400 });
  }

  const loaded = await fetchGuestSupabaseBookingForCheckout(bookingId);
  if (!loaded.ok) {
    return Response.json({ error: loaded.error }, { status: loaded.status });
  }

  const accommodationCents = amountCentsFromTotalPrice(loaded.row.total_price);
  if (accommodationCents === null || accommodationCents < 50) {
    return Response.json({ error: "Invalid booking total" }, { status: 400 });
  }

  const itemized = isBnhubItemizedCheckoutEnabled();
  const upsells = {
    insurance: request.nextUrl.searchParams.get("insurance") === "1",
    earlyCheckIn: request.nextUrl.searchParams.get("earlyCheckIn") === "1",
    lateCheckOut: request.nextUrl.searchParams.get("lateCheckOut") === "1",
  };

  if (!itemized) {
    return Response.json({
      itemized: false,
      listingTitle: loaded.listingTitle,
      accommodationCents,
      totalCents: accommodationCents,
    });
  }

  const breakdown = computeBnhubGuestCheckoutCents({
    accommodationCents,
    dates: loaded.row.dates,
    upsells,
  });

  return Response.json({
    itemized: true,
    listingTitle: loaded.listingTitle,
    ...breakdown,
  });
}
