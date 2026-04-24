import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { prisma } from "@/lib/db";
import { createPendingBrokerApproval } from "@/modules/approval/broker-approval-workflow.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/approval/create — queue a pending broker approval for a deal (pipeline / document / closing actions).
 */
export async function POST(request: Request) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    dealId?: string;
    actionKey?: string;
    actionPayload?: Record<string, unknown>;
    beforeSnapshot?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dealId = typeof body.dealId === "string" ? body.dealId.trim() : "";
  if (!dealId) return NextResponse.json({ error: "dealId required" }, { status: 400 });

  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || !canMutateExecution(userId, user.role, auth.deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const actionKey = typeof body.actionKey === "string" && body.actionKey.trim() ? body.actionKey.trim() : undefined;

  const created = await createPendingBrokerApproval({
    dealId,
    requestedByUserId: userId,
    actionKey,
    actionPayload: body.actionPayload,
    beforeSnapshot: body.beforeSnapshot,
  });

  return NextResponse.json({
    ok: true,
    id: created.id,
    disclaimer:
      "Pending approval is advisory queue only — OACIQ acknowledgment and signature are required on approve.",
  });
}
