import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  generateSimpleDescription,
  suggestAmenities,
  suggestPrice,
  type HostListingDescriptionInput,
} from "@/services/ai/host";

export const dynamic = "force-dynamic";

/**
 * Host wizard AI — plain language helpers.
 * Body: { action: "description" | "price" | "amenities", ... }
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";

  if (action === "description" || action === "optimize_description") {
    const input: HostListingDescriptionInput = {
      title: typeof body.title === "string" ? body.title : "",
      city: typeof body.city === "string" ? body.city : "",
      propertyType: typeof body.propertyType === "string" ? body.propertyType : undefined,
      maxGuests: body.maxGuests != null ? Number(body.maxGuests) : undefined,
      bedrooms: body.bedrooms != null ? Number(body.bedrooms) : undefined,
      amenities: Array.isArray(body.amenities)
        ? body.amenities.filter((x): x is string => typeof x === "string")
        : undefined,
    };
    return Response.json({ description: generateSimpleDescription(input) });
  }

  if (action === "price" || action === "suggest_price") {
    const city = typeof body.city === "string" ? body.city : "";
    const bedrooms = body.bedrooms != null ? Number(body.bedrooms) : undefined;
    const price = await suggestPrice(city, bedrooms);
    return Response.json({ suggestedPrice: price });
  }

  if (action === "amenities" || action === "auto_amenities") {
    const propertyType = typeof body.propertyType === "string" ? body.propertyType : undefined;
    return Response.json({ amenities: suggestAmenities(propertyType) });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
