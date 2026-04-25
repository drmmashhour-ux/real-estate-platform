import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { updateDisputeStatus } from "@/lib/bnhub/disputes";
import { prisma } from "@repo/db";

/**
 * POST /api/bnhub/disputes/:id/escalate
 * Escalate dispute to trust & safety. Admin or support only in production.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: disputeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason = body?.reason as string | undefined;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { id: true, status: true },
    });
    if (!dispute) return Response.json({ error: "Dispute not found" }, { status: 404 });

    const resolved = ["RESOLVED", "RESOLVED_PARTIAL_REFUND", "RESOLVED_FULL_REFUND", "RESOLVED_RELOCATION", "REJECTED", "CLOSED"];
    if (resolved.includes(dispute.status)) {
      return Response.json({ error: "Dispute already resolved" }, { status: 400 });
    }

    await updateDisputeStatus(disputeId, "ESCALATED", reason, userId);
    return Response.json({ success: true, status: "ESCALATED" });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to escalate" }, { status: 500 });
  }
}
