import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** GET /api/admin/finance/transactions — filtered platform payments + ledger */
export async function GET(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
  const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;
  if (dateTo) dateTo.setHours(23, 59, 59, 999);
  const userId = searchParams.get("userId")?.trim() || undefined;
  const brokerId = searchParams.get("brokerId")?.trim() || undefined;
  const listingId = searchParams.get("listingId")?.trim() || undefined;
  const bookingId = searchParams.get("bookingId")?.trim() || undefined;
  const dealId = searchParams.get("dealId")?.trim() || undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const status = searchParams.get("status")?.trim() || undefined;
  const paymentType = searchParams.get("paymentType")?.trim() || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

  const where = {
    ...(userId ? { userId } : {}),
    ...(brokerId ? { brokerCommissions: { some: { brokerId } } } : {}),
    ...(listingId ? { listingId } : {}),
    ...(bookingId ? { bookingId } : {}),
    ...(dealId ? { dealId } : {}),
    ...(status ? { status } : {}),
    ...(paymentType ? { paymentType } : {}),
    ...(q
      ? {
          user: {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.platformPayment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        userId: true,
        listingId: true,
        bookingId: true,
        dealId: true,
        projectId: true,
        paymentType: true,
        amountCents: true,
        currency: true,
        status: true,
        stripeSessionId: true,
        stripePaymentIntentId: true,
        stripeFeeCents: true,
        refundedAmountCents: true,
        metadata: true,
        brokerTaxSnapshot: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { email: true, name: true, id: true } },
        brokerCommissions: {
          select: {
            brokerAmountCents: true,
            platformAmountCents: true,
            brokerId: true,
            broker: { select: { email: true, name: true, id: true } },
          },
        },
      },
    }),
    prisma.platformPayment.count({ where }),
  ]);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "finance_transactions_list",
    ipAddress: ip,
    metadata: {
      page,
      limit,
      filters: { userId, brokerId, listingId, bookingId, dealId, q, status, paymentType },
    },
  });

  return Response.json({
    data: rows,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  });
}
