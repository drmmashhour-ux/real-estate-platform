import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { listingId } = body;
    return Response.json({
      title: "AI Generated Villa",
      description: "Beautiful AI-generated listing",
      highlights: ["Pool", "Sea view"],
      tags: ["luxury"],
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to generate listing" }, { status: 500 });
  }
}
