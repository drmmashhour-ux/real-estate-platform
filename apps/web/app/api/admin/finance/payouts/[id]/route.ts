import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import type { BrokerPayoutStatus } from "@prisma/client";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";
import { nextPayoutStatus } from "@/lib/admin/broker-payout-actions";

export const dynamic = "force-dynamic";

type PatchBody = {
  action: "approve" | "mark_paid" | "mark_failed" | "cancel";
  failureReason?: string;
};

/** PATCH — transition manual payout (no automated money movement) */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await getFinanceActor();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const existing = await prisma.brokerPayout.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const next = nextPayoutStatus(existing.status, body.action);
  if (!next) {
    return Response.json({ error: `Action ${body.action} not allowed for status ${existing.status}` }, { status: 400 });
  }

  const before = { status: existing.status, lineCount: existing.lines.length };

  if (body.action === "approve") {
    await prisma.brokerPayout.update({
      where: { id },
      data: {
        status: next,
        approvedAt: new Date(),
        approvedByUserId: actor.user.id,
      },
    });
  } else if (body.action === "mark_paid") {
    const paidAt = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.brokerPayout.update({
        where: { id },
        data: {
          status: next,
          paidAt,
          recordedPaidByUserId: actor.user.id,
        },
      });
      const commissionIds = existing.lines.map((l) => l.commissionId);
      await tx.brokerCommission.updateMany({
        where: { id: { in: commissionIds } },
        data: { status: "paid", paidAt },
      });
    });
  } else {
    // failed / cancel — release commissions for a new batch
    await prisma.$transaction(async (tx) => {
      await tx.brokerPayoutLine.deleteMany({ where: { payoutId: id } });
      await tx.brokerPayout.update({
        where: { id },
        data: {
          status: next as BrokerPayoutStatus,
          failureReason: body.failureReason?.slice(0, 2000) ?? null,
          approvedAt: null,
          approvedByUserId: null,
          paidAt: null,
          recordedPaidByUserId: null,
        },
      });
    });
  }

  const after = await prisma.brokerPayout.findUnique({ where: { id } });

  await logFinancialAction({
    actorUserId: actor.user.id,
    action: `broker_payout_${body.action}`,
    entityType: "BrokerPayout",
    entityId: id,
    ipAddress: ip,
    metadata: {
      before,
      after: { status: after?.status },
      failureReason: body.failureReason ?? null,
    },
  });

  return Response.json({ ok: true, payout: after });
}
