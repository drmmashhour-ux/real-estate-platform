import { NextRequest, NextResponse } from "next/server";
import { authenticatePublicApi, recordApiCall } from "@/src/api/auth";
import { handlePublicAnalyticsGET } from "@/src/api/handlers/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticatePublicApi(req, "analytics:read");
  if (!auth.ok) return auth.response;
  try {
    const data = await handlePublicAnalyticsGET(req.nextUrl.searchParams);
    await recordApiCall(auth.ctx.key.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
