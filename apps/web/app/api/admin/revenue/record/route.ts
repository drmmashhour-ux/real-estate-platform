import { NextRequest } from "next/server";
import { recordRevenueEntry } from "@/lib/revenue-intelligence";
import type { RevenueLedgerType } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_TYPES: RevenueLedgerType[] = [
  "BOOKING_COMMISSION", "REAL_ESTATE_COMMISSION", "SUBSCRIPTION", "PROMOTION",
  "REFERRAL_COST", "REFUND", "CHARGEBACK", "INCENTIVE", "PAYOUT",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body?.type as string;
    if (!VALID_TYPES.includes(type as RevenueLedgerType)) {
      return Response.json({ error: "Invalid type" }, { status: 400 });
    }
    const entityType = body?.entityType as string;
    const entityId = body?.entityId as string;
    const amountCents = Number(body?.amountCents);
    if (!entityType || !entityId || Number.isNaN(amountCents)) {
      return Response.json(
        { error: "entityType, entityId, amountCents required" },
        { status: 400 }
      );
    }
    const entry = await recordRevenueEntry({
      type: type as RevenueLedgerType,
      entityType,
      entityId,
      amountCents,
      marketId: body?.marketId,
      module: body?.module,
      userId: body?.userId,
      metadata: body?.metadata,
    });
    return Response.json(entry);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to record revenue entry" }, { status: 500 });
  }
}
