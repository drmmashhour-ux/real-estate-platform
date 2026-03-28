import { NextRequest, NextResponse } from "next/server";
import { authenticatePublicApi, recordApiCall } from "@/src/api/auth";
import { handlePublicListingsGET } from "@/src/api/handlers/listings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticatePublicApi(req, "listings:read");
  if (!auth.ok) return auth.response;
  try {
    const data = await handlePublicListingsGET(req.nextUrl.searchParams);
    await recordApiCall(auth.ctx.key.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
