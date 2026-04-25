import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertCanCreateListing } from "@/lib/compliance/professional-compliance";
import { generateBnhubListingDraftContent } from "@/lib/bnhub/ai-listing-draft";

export const dynamic = "force-dynamic";

/**
 * Generate title, description, amenities from address + price + basics (no DB write).
 * Host must review and confirm before publishing.
 */
export async function POST(req: NextRequest) {
  const ownerId = await getGuestId();
  if (!ownerId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const gate = await assertCanCreateListing({
    userId: ownerId,
    listingAuthorityType: "OWNER",
    brokerLicenseNumber: null,
    brokerageName: null,
  });
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.reasons.join(". ") || "Listing creation not permitted", reasons: gate.reasons },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const region = typeof body.region === "string" ? body.region.trim() : "";
  const country = typeof body.country === "string" ? body.country.trim() : "CA";
  const propertyType = typeof body.propertyType === "string" ? body.propertyType.trim() : "Apartment";
  const roomType = typeof body.roomType === "string" ? body.roomType.trim() : "Entire place";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  const nightPriceCents =
    body.nightPriceCents != null && Number.isFinite(Number(body.nightPriceCents))
      ? Math.round(Number(body.nightPriceCents))
      : body.priceCad != null && Number.isFinite(Number(body.priceCad))
        ? Math.round(Number(body.priceCad) * 100)
        : NaN;

  const beds = body.beds != null ? Math.max(1, parseInt(String(body.beds), 10) || 1) : 1;
  const baths = body.baths != null ? Math.max(0.5, Number(body.baths) || 1) : 1;
  const maxGuests = body.maxGuests != null ? Math.max(1, parseInt(String(body.maxGuests), 10) || 2) : 2;

  if (!address || !city || !Number.isFinite(nightPriceCents) || nightPriceCents < 100) {
    return NextResponse.json(
      { error: "address, city, and nightly price (at least $1.00) are required" },
      { status: 400 }
    );
  }

  const result = await generateBnhubListingDraftContent({
    address,
    city,
    region: region || null,
    country: country || "CA",
    nightPriceCents,
    propertyType,
    roomType,
    beds,
    baths,
    maxGuests,
    notes: notes || null,
  });

  return NextResponse.json({ ok: true, ...result });
}
