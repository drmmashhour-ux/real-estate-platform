import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { prisma } from "@/lib/db";
import { rejectBrokerApproval } from "@/modules/approval/broker-approval-workflow.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/approval/[id]/reject — reject a pending broker approval with audit reason.
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

  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 4) {
    return NextResponse.json({ error: "Rejection reason required (min 4 chars)." }, { status: 400 });
  }

  try {
    await rejectBrokerApproval({ approvalId, brokerUserId: auth.userId, reason });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Reject failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
