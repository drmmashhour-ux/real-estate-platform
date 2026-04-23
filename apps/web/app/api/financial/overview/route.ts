import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminTrustSession } from "@/lib/compliance/trust-route-guard";
import { sessionOwnsFinancialOwner } from "@/lib/compliance/financial-route-guard";

export const dynamic = "force-dynamic";

function monthBounds(periodKey: string): { start: Date; end: Date } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(periodKey);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const start = new Date(Date.UTC(y, mo - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, mo, 0, 23, 59, 59, 999));
  return { start, end };
}

/**
 * GET ?periodKey=2026-04&ownerType=&ownerId=&agencyId=
 * Brokers default to their solo owner; admins must pass ownerType + ownerId.
 */
export async function GET(req: Request) {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  const url = new URL(req.url);
  const periodKey =
    url.searchParams.get("periodKey")?.trim() || new Date().toISOString().slice(0, 7);

  const bounds = monthBounds(periodKey);
  if (!bounds) {
    return NextResponse.json({ success: false, error: "INVALID_PERIOD_KEY" }, { status: 400 });
  }

  let ownerType = url.searchParams.get("ownerType")?.trim() ?? "";
  let ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const agencyId = url.searchParams.get("agencyId")?.trim() || null;

  if (session.role === PlatformRole.BROKER) {
    if (agencyId) {
      ownerType = "agency";
      ownerId = agencyId;
    } else {
      ownerType = "solo_broker";
      ownerId = session.userId;
    }
  }

  if (!ownerType || !ownerId) {
    return NextResponse.json({ success: false, error: "OWNER_REQUIRED" }, { status: 400 });
  }

  if (!sessionOwnsFinancialOwner(ownerType, ownerId, session, { agencyId })) {
    return NextResponse.json({ success: false, error: "OWNER_FORBIDDEN" }, { status: 403 });
  }

  const receipts = await prisma.cashReceiptForm.findMany({
    where: {
      ownerType,
      ownerId,
      receivedAt: { gte: bounds.start, lte: bounds.end },
    },
    select: { amountCents: true, fundsDestinationType: true },
  });

  const sums = {
    trust_cents: 0,
    operating_cents: 0,
    platform_cents: 0,
    pending_review_cents: 0,
    pending_review_count: 0,
  };

  for (const r of receipts) {
    if (r.fundsDestinationType === "trust") sums.trust_cents += r.amountCents;
    else if (r.fundsDestinationType === "operating") sums.operating_cents += r.amountCents;
    else if (r.fundsDestinationType === "platform_revenue") sums.platform_cents += r.amountCents;
    else {
      sums.pending_review_cents += r.amountCents;
      sums.pending_review_count += 1;
    }
  }

  const registers = await prisma.financialRegister.findMany({
    where: { ownerType, ownerId, periodKey },
    orderBy: { registerType: "asc" },
    take: 50,
  });

  return NextResponse.json({
    success: true,
    periodKey,
    sums,
    registers,
    receiptCount: receipts.length,
  });
}
