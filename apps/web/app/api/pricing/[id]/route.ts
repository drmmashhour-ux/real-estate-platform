import {
  getDynamicPriceForSource,
  type PricingDataSource,
} from "@/lib/services/pricingEngine";

export const dynamic = "force-dynamic";

function parseSource(raw: string | null): PricingDataSource {
  if (raw === "bnhub") return "bnhub";
  return "marketplace";
}

/**
 * Suggested dynamic price: `source=bnhub` → `bnhub_listings` + `Booking`; default `marketplace` → `Listing` + `listing_bookings`.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return Response.json({ error: "id required" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const source = parseSource(searchParams.get("source"));
  const price = await getDynamicPriceForSource(id.trim(), source);
  if (price == null) {
    return Response.json(
      { error: "Not found or insufficient pricing data" },
      { status: 404 }
    );
  }
  return Response.json({ price, source });
}
