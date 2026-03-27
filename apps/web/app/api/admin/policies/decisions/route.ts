import { NextRequest } from "next/server";
import { getPolicyDecisionLog } from "@/lib/policy-engine";

export const dynamic = "force-dynamic";

/** GET: policy decision log (audit/debug). */
export async function GET(request: NextRequest) {
  try {
    const ruleKey = request.nextUrl.searchParams.get("ruleKey") ?? undefined;
    const entityType = request.nextUrl.searchParams.get("entityType") ?? undefined;
    const entityId = request.nextUrl.searchParams.get("entityId") ?? undefined;
    const since = request.nextUrl.searchParams.get("since");
    const limit = request.nextUrl.searchParams.get("limit");
    const log = await getPolicyDecisionLog({
      ruleKey,
      entityType,
      entityId,
      since: since ? new Date(since) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    return Response.json(log);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get decision log" }, { status: 500 });
  }
}
