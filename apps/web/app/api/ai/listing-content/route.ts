import { generateListingContent } from "@/lib/ai/generateListingContent";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/listing-content
 * Body: { listingId?: string }
 * Returns: { title, subtitle, description, features } for use in Canva.
 * TEMP: uses mock listing until DB connected.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { listingId } = body;

  // TEMP: mock listing (until DB connected)
  const listing = {
    city: "Montreal",
    price: 500000,
    bedrooms: 3,
  };

  const content = generateListingContent(listing);

  return Response.json(content);
}
