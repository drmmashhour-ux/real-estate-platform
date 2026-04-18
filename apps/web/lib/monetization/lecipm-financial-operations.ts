import { prisma } from "@/lib/db";
import { asOptionalInputJsonValue } from "@/lib/prisma/as-input-json";
import { logInfo } from "@/lib/logger";

/**
 * Persist + structured log for monetization checkout rows (audit trail).
 * Does not replace accounting ledger — pairs with Stripe objects.
 */
export async function recordLecipmMonetizationTransaction(input: {
  userId: string | null;
  type: string;
  amount: number;
  currency?: string;
  status: string;
  stripePaymentIntentId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string }> {
  const row = await prisma.lecipmMonetizationTransaction.create({
    data: {
      userId: input.userId ?? undefined,
      type: input.type,
      amount: input.amount,
      currency: input.currency ?? "CAD",
      status: input.status,
      stripePaymentIntentId: input.stripePaymentIntentId ?? undefined,
      metadata: asOptionalInputJsonValue(input.metadata),
    },
    select: { id: true },
  });

  logInfo("[lecipm][monetization_transaction]", {
    id: row.id,
    type: input.type,
    status: input.status,
    amount: input.amount,
    currency: input.currency ?? "CAD",
    userId: input.userId,
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
  });

  return row;
}

export async function recordLecipmRevenueAttribution(input: {
  source: string;
  amount: number;
  category: string;
  referenceId?: string | null;
  currency?: string;
}): Promise<{ id: string }> {
  const row = await prisma.lecipmRevenueAttributionEvent.create({
    data: {
      source: input.source,
      amount: input.amount,
      category: input.category,
      referenceId: input.referenceId ?? undefined,
      currency: input.currency ?? "CAD",
    },
    select: { id: true },
  });

  logInfo("[lecipm][revenue_attribution]", {
    id: row.id,
    source: input.source,
    category: input.category,
    amount: input.amount,
  });

  return row;
}
