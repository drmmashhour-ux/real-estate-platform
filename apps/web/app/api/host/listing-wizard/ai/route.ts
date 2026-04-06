import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  generateDescription,
  generateTitle,
  suggestAmenities,
  suggestPrice,
  type ListingWizardAiContext,
} from "@/services/ai/fast";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  const city = typeof body.city === "string" ? body.city : "";

  if (action === "title") {
    return Response.json({ title: generateTitle(city) });
  }

  if (action === "price") {
    const suggested = await suggestPrice(city);
    return Response.json({ suggestedPrice: suggested });
  }

  if (action === "amenities") {
    return Response.json({ amenities: suggestAmenities() });
  }

  if (action === "description") {
    const ctx: ListingWizardAiContext = {
      city,
      title: typeof body.title === "string" ? body.title : undefined,
      pricePerNight: body.price != null ? Number(body.price) : undefined,
      amenities: Array.isArray(body.amenities)
        ? body.amenities.filter((x): x is string => typeof x === "string")
        : undefined,
    };
    return Response.json({ description: generateDescription(ctx) });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
