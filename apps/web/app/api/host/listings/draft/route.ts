import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createHostListingDraft } from "@/lib/host/create-host-listing-draft";

export const dynamic = "force-dynamic";

/** Step 1 — create a saved draft the host can continue editing. */
export async function POST(req: NextRequest) {
  try {
    const ownerId = await getGuestId();
    if (!ownerId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    if (!title || !city) {
      return Response.json({ error: "Title and city are required." }, { status: 400 });
    }

    const result = await createHostListingDraft(ownerId, {
      title,
      city,
      address: typeof body.address === "string" ? body.address : undefined,
      propertyType: typeof body.propertyType === "string" ? body.propertyType : undefined,
      roomType: typeof body.roomType === "string" ? body.roomType : undefined,
      maxGuests: body.maxGuests != null ? Number(body.maxGuests) : undefined,
      bedrooms: body.bedrooms != null ? Number(body.bedrooms) : undefined,
      beds: body.beds != null ? Number(body.beds) : undefined,
      baths: body.baths != null ? Number(body.baths) : undefined,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error, reasons: result.reasons },
        { status: result.status }
      );
    }

    return Response.json({ id: result.id, listingCode: result.listingCode });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Could not save draft" },
      { status: 400 }
    );
  }
}
