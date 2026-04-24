import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { prisma } from "@/lib/db";
import { listPendingBrokerApprovalsForUser } from "@/modules/approval/broker-approval-workflow.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/approval/pending — broker (or admin) pending approval queue.
 */
export async function GET() {
  const gated = requireDealExecutionV1();
  if (gated) return gated;

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Broker access only" }, { status: 403 });
  }

  const rows = await listPendingBrokerApprovalsForUser(userId, user.role === PlatformRole.ADMIN);

  return NextResponse.json({
    ok: true,
    pending: rows.map((r) => ({
      id: r.id,
      dealId: r.dealId,
      actionKey: r.actionKey,
      createdAt: r.createdAt.toISOString(),
      deal: r.deal,
    })),
  });
}
