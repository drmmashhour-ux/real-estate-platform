import type { Prisma } from "@prisma/client";
import type { MapFormResult } from "@/modules/oaciq-mapper/mapper.types";
import type { LecipmPaymentKind, LecipmTrustWorkflowMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { appendLedgerEntry } from "../payment-ledger.service";
import { logPaymentOpsEvent } from "../payments-ops-audit.service";

function parseCents(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = Number(String(raw).replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

/**
 * Creates a draft deposit payment + trust workflow profile from mapped PP fields (specimen paths).
 * Does not confirm funds — broker must verify against the official PP.
 */
export async function createDepositPaymentFromPpMap(input: {
  dealId: string;
  map: MapFormResult;
  actorUserId: string;
  trustMode?: LecipmTrustWorkflowMode;
}): Promise<{ paymentId: string; amountCents: number } | { error: string }> {
  const m = input.map.mappedFields as Record<string, unknown>;
  const amountCents =
    parseCents(m["pp.p4.depositAmount"]) ??
    parseCents(m["pp.p5.deposit"]) ??
    parseCents(m["deal.deposit.amount"]);

  if (amountCents === null || amountCents <= 0) {
    return { error: "No deposit amount found in PP map (pp.p4.depositAmount / pp.p5.deposit)." };
  }

  const trusteeName = (m["pp.p4.trusteeName"] as string | undefined)?.trim() || null;
  const depositTiming = (m["pp.p4.depositTiming"] as string | undefined)?.trim() || null;
  const depositMethod = (m["pp.p4.depositMethod"] as string | undefined)?.trim() || null;

  const payment = await prisma.lecipmDealPayment.create({
    data: {
      dealId: input.dealId,
      paymentKind: "deposit" satisfies LecipmPaymentKind,
      status: "draft",
      amountCents,
      currency: "cad",
      provider: "manual",
      metadata: {
        source: "pp_mapper",
        depositTiming,
        depositMethod,
        trusteeName,
      },
    },
  });

  await prisma.lecipmPaymentInstruction.create({
    data: {
      dealPaymentId: payment.id,
      instructionType: "pp_deposit_profile",
      payload: {
        depositTiming,
        depositMethod,
        trusteeName,
        notes: "Generated from Exact PP mapper — verify against official form.",
      },
    },
  });

  await prisma.lecipmTrustWorkflow.upsert({
    where: { dealId: input.dealId },
    create: {
      dealId: input.dealId,
      mode: input.trustMode ?? "manual_trust_workflow",
      status: "profiled",
      trusteeName: trusteeName ?? undefined,
      trusteeType: depositMethod ?? undefined,
      trustAccountReference: null,
      notes: [{ at: new Date().toISOString(), from: "pp_mapper", depositTiming, depositMethod }] as Prisma.InputJsonValue,
    },
    update: {
      trusteeName: trusteeName ?? undefined,
      status: "profiled",
      notes: [{ at: new Date().toISOString(), from: "pp_mapper", depositTiming, depositMethod }] as Prisma.InputJsonValue,
    },
  });

  await appendLedgerEntry({
    dealId: input.dealId,
    paymentId: payment.id,
    entryKind: "request_created",
    amountCents,
    description: "Draft deposit payment from PP map",
    actorUserId: input.actorUserId,
  });

  await logPaymentOpsEvent(
    input.dealId,
    "pp_deposit_payment_drafted",
    { paymentId: payment.id, amountCents },
    input.actorUserId,
  );

  return { paymentId: payment.id, amountCents };
}
