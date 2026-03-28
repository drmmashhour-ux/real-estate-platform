import { NextRequest, NextResponse } from "next/server";
import { authenticatePublicApi, recordApiCall } from "@/src/api/auth";
import { handlePublicBookingsGET } from "@/src/api/handlers/bookings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticatePublicApi(req, "bookings:read");
  if (!auth.ok) return auth.response;
  try {
    const data = await handlePublicBookingsGET(req.nextUrl.searchParams);
    await recordApiCall(auth.ctx.key.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
