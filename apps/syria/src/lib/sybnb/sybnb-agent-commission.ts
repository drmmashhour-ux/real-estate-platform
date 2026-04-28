/**
 * SYBNB-35 — agent booking commission from platform fee share (same currency as `SyriaBooking.platformFeeAmount`).
 */

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { syriaPropertyExcludeInvestorDemoWhere } from "@/lib/sybnb/demo-metrics-filter";

function commissionRate(): Prisma.Decimal {
  const raw = process.env.SYBNB_AGENT_COMMISSION_RATE ?? "0.10";
  const d = new Prisma.Decimal(raw);
  return d.gt(0) && d.lte(1) ? d : new Prisma.Decimal("0.10");
}

function commissionMinimum(): Prisma.Decimal {
  const raw = process.env.SYBNB_AGENT_COMMISSION_MIN ?? "3";
  const d = new Prisma.Decimal(raw);
  return d.gte(0) ? d : new Prisma.Decimal("3");
}

function maxDecimal(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
  return a.gt(b) ? a : b;
}

function minDecimal(a: Prisma.Decimal, b: Prisma.Decimal): Prisma.Decimal {
  return a.lt(b) ? a : b;
}

/**
 * `max(rate × platformFee, minimum)`, capped at platform fee so payouts never exceed fee collected.
 */
export function computeSybnbAgentCommissionAmount(platformFeeAmount: Prisma.Decimal): Prisma.Decimal {
  const rate = commissionRate();
  const minimum = commissionMinimum();
  const pct = platformFeeAmount.mul(rate);
  const uncapped = maxDecimal(pct, minimum);
  return minDecimal(uncapped, platformFeeAmount);
}

/**
 * Idempotent: creates one pending earning row when guest payment clears and listing has a field agent.
 */
export async function maybeRecordSybnbAgentEarningForPaidSyriaBooking(bookingId: string): Promise<void> {
  const booking = await prisma.syriaBooking.findUnique({
    where: { id: bookingId.trim() },
    include: { property: true },
  });
  if (!booking?.platformFeeAmount) return;
  const agentId = booking.property.sybnbAgentUserId;
  if (!agentId) return;

  const notDemo = await prisma.syriaProperty.findFirst({
    where: {
      AND: [{ id: booking.propertyId }, syriaPropertyExcludeInvestorDemoWhere()],
    },
    select: { id: true },
  });
  if (!notDemo) return;

  const amount = computeSybnbAgentCommissionAmount(booking.platformFeeAmount);
  if (amount.lte(0)) return;

  await prisma.sybnbAgentEarning.upsert({
    where: { bookingId: booking.id },
    create: {
      agentId,
      bookingId: booking.id,
      amount,
      currency: booking.currency,
      status: "pending",
    },
    update: {},
  });
}
