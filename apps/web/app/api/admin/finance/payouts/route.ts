import { NextRequest } from "next/server";
import type { BrokerPayoutStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";
import { randomUUID } from "crypto";

const PAYOUT_STATUSES: BrokerPayoutStatus[] = ["PENDING", "APPROVED", "PAID", "FAILED", "CANCELLED"];

export const dynamic = "force-dynamic";

/** GET /api/admin/finance/payouts — manual broker payout batches */
export async function GET(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const brokerId = searchParams.get("brokerId")?.trim() || undefined;
  const statusRaw = searchParams.get("status")?.trim();
  const status =
    statusRaw && PAYOUT_STATUSES.includes(statusRaw as BrokerPayoutStatus) ? (statusRaw as BrokerPayoutStatus) : undefined;
  const includePendingCommissions = searchParams.get("includePendingCommissions") === "1";

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const [payouts, pendingByBroker] = await Promise.all([
    prisma.brokerPayout.findMany({
      where: {
        ...(brokerId ? { brokerId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        broker: { select: { id: true, email: true, name: true } },
        lines: {
          include: {
            commission: {
              select: {
                id: true,
                brokerAmountCents: true,
                status: true,
                payment: { select: { paymentType: true, id: true } },
              },
            },
          },
        },
      },
    }),
    includePendingCommissions
      ? prisma.brokerCommission.findMany({
          where: {
            status: "pending",
            brokerId: { not: null },
            payoutLine: null,
            ...(brokerId ? { brokerId } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 500,
          include: {
            broker: { select: { id: true, email: true, name: true } },
            payment: { select: { paymentType: true, amountCents: true, createdAt: true, id: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "finance_payout_list",
    ipAddress: ip,
    metadata: { brokerId, status, includePendingCommissions },
  });

  return Response.json({ payouts, pendingCommissions: pendingByBroker });
}

type PostBody = {
  brokerId: string;
  commissionIds: string[];
  notes?: string;
  payoutMethod?: string;
};

/** POST — create manual payout batch from pending commissions */
export async function POST(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.brokerId || !Array.isArray(body.commissionIds) || body.commissionIds.length === 0) {
    return Response.json({ error: "brokerId and commissionIds required" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  try {
    const payout = await prisma.$transaction(async (tx) => {
      const commissions = await tx.brokerCommission.findMany({
        where: {
          id: { in: body.commissionIds },
          brokerId: body.brokerId,
          status: "pending",
          payoutLine: null,
        },
      });

      if (commissions.length !== body.commissionIds.length) {
        throw new Error("INVALID_COMMISSIONS");
      }

      const total = commissions.reduce((s, c) => s + c.brokerAmountCents, 0);
      if (total <= 0) throw new Error("ZERO_AMOUNT");

      const id = randomUUID();
      await tx.brokerPayout.create({
        data: {
          id,
          brokerId: body.brokerId,
          totalAmountCents: total,
          payoutMethod: (body.payoutMethod ?? "manual").slice(0, 64),
          notes: body.notes?.slice(0, 4000) ?? null,
          lines: {
            create: commissions.map((c) => ({
              commissionId: c.id,
            })),
          },
        },
      });

      return tx.brokerPayout.findUnique({
        where: { id },
        include: {
          broker: { select: { email: true, name: true } },
          lines: { include: { commission: true } },
        },
      });
    });

    await logFinancialAction({
      actorUserId: actor.user.id,
      action: "broker_payout_created",
      entityType: "BrokerPayout",
      entityId: payout!.id,
      ipAddress: ip,
      metadata: {
        brokerId: body.brokerId,
        commissionIds: body.commissionIds,
        totalAmountCents: payout!.totalAmountCents,
      },
    });

    return Response.json({ ok: true, payout });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "INVALID_COMMISSIONS") {
      return Response.json(
        { error: "All commissions must be pending, same broker, and not already in a batch." },
        { status: 400 }
      );
    }
    if (msg === "ZERO_AMOUNT") {
      return Response.json({ error: "Total broker amount must be positive." }, { status: 400 });
    }
    console.error("[finance/payouts POST]", e);
    return Response.json({ error: "Failed to create payout" }, { status: 500 });
  }
}
