import { NextResponse } from "next/server";
import { getMarketPricingAssistant } from "@/lib/valuation/market-pricing-assistant";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const address = typeof body.address === "string" ? body.address.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const propertyType = typeof body.propertyType === "string" ? body.propertyType.trim() : "";
    const condition = typeof body.condition === "string" ? body.condition.trim() : undefined;
    const mode = body.mode === "seller" ? "seller" : "buyer";
    const askingPrice = Number(body.askingPrice);
    const bedrooms = Number(body.bedrooms);
    const bathrooms = Number(body.bathrooms);
    const surfaceSqft = Number(body.surfaceSqft);

    if (!city || !propertyType || !Number.isFinite(askingPrice) || !Number.isFinite(surfaceSqft)) {
      return NextResponse.json(
        { error: "City, property type, asking price, and surface area are required." },
        { status: 400 }
      );
    }

    const result = getMarketPricingAssistant({
      mode,
      address: address || "Unknown address",
      city,
      propertyType,
      bedrooms: Number.isFinite(bedrooms) ? bedrooms : 0,
      bathrooms: Number.isFinite(bathrooms) ? bathrooms : 0,
      surfaceSqft,
      condition,
      askingPrice,
    });

    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json({ error: "Unable to generate pricing guidance." }, { status: 500 });
  }
}
