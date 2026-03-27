import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => ({}));
    return Response.json({
      designUrl: "https://www.canva.com/create/posters/",
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to generate poster" }, { status: 500 });
  }
}
