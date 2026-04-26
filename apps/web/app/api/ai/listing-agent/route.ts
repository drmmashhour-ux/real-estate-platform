import { analyzeListing, type ListingAgentInput } from "@/lib/ai/listingAgent";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body === null || typeof body !== "object") {
    return Response.json({ error: "Expected listing object" }, { status: 400 });
  }

  return Response.json(analyzeListing(body as ListingAgentInput));
}
