import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { listIncidents } from "@/lib/trust-safety/incident-service";

/**
 * GET /api/admin/trust-safety/incidents
 * Query: status, severity, category, reporterId, accusedUserId, listingId, limit
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const incidents = await listIncidents({
      status: searchParams.get("status") ?? undefined,
      severity: searchParams.get("severity") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      reporterId: searchParams.get("reporterId") ?? undefined,
      accusedUserId: searchParams.get("accusedUserId") ?? undefined,
      listingId: searchParams.get("listingId") ?? undefined,
      limit: Number(searchParams.get("limit")) || 50,
    });
    return Response.json({ incidents });
  } catch (e) {
    return Response.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}
