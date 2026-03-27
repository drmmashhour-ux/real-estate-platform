import { NextRequest } from "next/server";
import { analyzeListing } from "@/lib/ai-listing-analysis";

export const dynamic = "force-dynamic";

/** POST /api/ai/listing-analysis – analyze listing quality, return recommendations. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, amenities, location, photos } = body;
    if (!title || typeof title !== "string") {
      return Response.json({ error: "title required" }, { status: 400 });
    }
    const result = analyzeListing({
      title,
      description: typeof description === "string" ? description : undefined,
      amenities: Array.isArray(amenities) ? amenities : undefined,
      location:
        location && typeof location === "object"
          ? { city: location.city, address: location.address }
          : undefined,
      photos: Array.isArray(photos) ? photos : undefined,
    });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to analyze listing" },
      { status: 500 }
    );
  }
}
