import { getInsights } from "@lecipm/api/internal";
import { NextRequest, NextResponse } from "next/server";
import { recordPublicApiUsage } from "@/lib/platform/api-usage";
import { authenticatePublicApi } from "@/lib/platform/public-api-auth";

export async function GET(req: NextRequest) {
  const auth = authenticatePublicApi(req, ["insights:read"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  recordPublicApiUsage(auth.partner.id, "/api/public/insights", "GET");
  const data = await getInsights({ partnerId: auth.partner.id });
  return NextResponse.json({ data });
}
