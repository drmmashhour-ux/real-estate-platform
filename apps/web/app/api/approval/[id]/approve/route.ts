import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { prisma } from "@/lib/db";
import { approvePendingBrokerApproval } from "@/modules/approval/broker-approval-workflow.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/approval/[id]/approve — finalize a pending broker approval (OACIQ ack + signature attestation).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;

  const { id: approvalId } = await context.params;
  const row = await prisma.brokerApproval.findUnique({
    where: { id: approvalId },
    select: { id: true, dealId: true, status: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.status !== "PENDING") {
    return NextResponse.json({ error: "Approval is not pending" }, { status: 409 });
  }

  const auth = await authenticateBrokerDealRoute(row.dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!user || !canMutateExecution(auth.userId, user.role, auth.deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { oaciqBrokerAcknowledged?: boolean; afterSnapshot?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.oaciqBrokerAcknowledged !== true) {
    return NextResponse.json(
      { error: "OACIQ broker acknowledgment is required (oaciqBrokerAcknowledged: true)." },
      { status: 400 },
    );
  }

  try {
    const out = await approvePendingBrokerApproval({
      approvalId,
      brokerUserId: auth.userId,
      oaciqBrokerAcknowledged: true,
      afterSnapshot: body.afterSnapshot,
    });
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Approve failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
