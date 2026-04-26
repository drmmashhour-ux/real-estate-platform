import { getDynamicPrice } from "@/lib/services/pricingEngine";

export const dynamic = "force-dynamic";

/**
 * Suggested dynamic nightly price for a BNHub `ShortTermListing` (id in path).
 * Uses SQL aggregates over `"Booking"` + base `nightPriceCents` (see `pricingEngine.ts`).
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return Response.json({ error: "id required" }, { status: 400 });
  }
  const price = await getDynamicPrice(id.trim());
  if (price == null) {
    return Response.json(
      { error: "Not found or insufficient pricing data" },
      { status: 404 }
    );
  }
  return Response.json({ price });
}
