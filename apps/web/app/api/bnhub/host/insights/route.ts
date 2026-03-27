import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getHostInsights } from "@/lib/bnhub/host-insights";

/** GET /api/bnhub/host/insights?ownerId= — signed-in host or explicit ownerId (demo). */
export async function GET(request: NextRequest) {
  try {
    const sessionId = await getGuestId();
    const ownerIdParam = request.nextUrl.searchParams.get("ownerId");
    const ownerId = ownerIdParam ?? sessionId ?? process.env.NEXT_PUBLIC_DEMO_HOST_ID ?? null;
    if (!ownerId) return Response.json({ error: "ownerId or session required" }, { status: 401 });
    if (ownerIdParam && sessionId && ownerIdParam !== sessionId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const insights = await getHostInsights(ownerId);
    return Response.json(insights);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
