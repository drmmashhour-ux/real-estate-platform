import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { resolveAppeal } from "@/lib/trust-safety/appeals-service";
import type { TrustSafetyAppealStatus } from "@prisma/client";

/**
 * POST /api/admin/trust-safety/appeals/:id/resolve
 * Body: { status: APPROVED | REJECTED | WITHDRAWN, resolutionNote?: string }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const reviewedBy = await getGuestId();
    if (!reviewedBy) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: appealId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const status = body?.status as TrustSafetyAppealStatus | undefined;
    const allowed: TrustSafetyAppealStatus[] = ["APPROVED", "REJECTED", "WITHDRAWN"];
    if (!status || !allowed.includes(status)) {
      return Response.json({ error: "status must be APPROVED, REJECTED, or WITHDRAWN" }, { status: 400 });
    }

    await resolveAppeal({
      appealId,
      status,
      reviewedBy,
      resolutionNote: body?.resolutionNote,
    });
    return Response.json({ success: true, status });
  } catch (e) {
    return Response.json({ error: "Failed to resolve appeal" }, { status: 400 });
  }
}
