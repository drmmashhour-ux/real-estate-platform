import { prisma } from "@/lib/db";
import {
  sybnbCoreAuditExcludeInvestorDemoWhere,
  syriaBookingInvestorDemoExclusionClauses,
} from "@/lib/sybnb/demo-metrics-filter";

/**
 * Monitoring aggregates use `SyriaSybnbCoreAudit` rows (no separate “payment attempts” table).
 * F1 listing finance audit logs are out of scope here.
 */

/** Human-safe event row (no raw payment payloads / secrets). */
export type SybnbMonitorEventRow = {
  id: string;
  kind: "audit" | "payout_snapshot";
  event: string;
  createdAt: Date;
  bookingId: string | null;
  /** Redacted summary only */
  summary: string | null;
};

export type SybnbPaymentMonitorStats = {
  /** Stub / demo payment-intent creations (sandbox signals). */
  totalPaymentAttempts: number;
  blockedPayments: number;
  /** Checkout completed via webhook (`checkout_webhook_paid`). */
  webhookPaidCompletions: number;
  payoutsHeld: number;
  payoutsEligible: number;
  payoutsReleased: number;
  payoutsBlocked: number;
};

/** Exported for DR.BRAIN charts — safe event names only (no payloads). */
export const PAYMENT_ATTEMPT_EVENTS = ["payment_intent_stub_issued", "payment_intent_demo_stub"] as const;
export const BLOCKED_PAYMENT_EVENTS = [
  "payment_intent_blocked",
  "checkout_payment_blocked",
  "SYBNB_PAYOUT_RELEASE_DENIED",
  "SYBNB_PAYOUT_KILL_SWITCH_BLOCKED",
  "SYBNB_PAYOUT_RELEASE_BLOCKED",
] as const;

const SENSITIVE_METADATA_KEY = /secret|password|token|authorization|clientsecret|apikey|webhook_secret|bearer/i;

function sanitizeMetadataLine(meta: unknown): string | null {
  if (meta == null || typeof meta !== "object") return null;
  const o = meta as Record<string, unknown>;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (SENSITIVE_METADATA_KEY.test(k)) continue;
    if (typeof v === "string" && v.length > 120) parts.push(`${k}:…`);
    else if (typeof v === "number" || typeof v === "boolean") parts.push(`${k}:${String(v)}`);
    else if (v === null) parts.push(`${k}:null`);
    else if (typeof v === "string") parts.push(`${k}:${v.slice(0, 80)}`);
  }
  return parts.length ? parts.slice(0, 6).join(" · ") : null;
}

/**
 * Aggregated payment + payout posture (SyriaBooking / SyriaSybnbCoreAudit / SyriaPayout only).
 */
export async function getSybnbPaymentStats(): Promise<SybnbPaymentMonitorStats> {
  const [
    paymentAttempts,
    blockedPayments,
    webhookPaidCompletions,
    held,
    eligible,
    released,
    blockedEscrow,
  ] = await Promise.all([
    prisma.syriaSybnbCoreAudit.count({
      where: {
        event: { in: [...PAYMENT_ATTEMPT_EVENTS] },
        AND: [sybnbCoreAuditExcludeInvestorDemoWhere()],
      },
    }),
    prisma.syriaSybnbCoreAudit.count({
      where: {
        event: { in: [...BLOCKED_PAYMENT_EVENTS] },
        AND: [sybnbCoreAuditExcludeInvestorDemoWhere()],
      },
    }),
    prisma.syriaSybnbCoreAudit.count({
      where: {
        event: "checkout_webhook_paid",
        AND: [sybnbCoreAuditExcludeInvestorDemoWhere()],
      },
    }),
    prisma.syriaPayout.count({
      where: {
        escrowStatus: "HELD",
        booking: { AND: syriaBookingInvestorDemoExclusionClauses() },
      },
    }),
    prisma.syriaPayout.count({
      where: {
        escrowStatus: "ELIGIBLE",
        booking: { AND: syriaBookingInvestorDemoExclusionClauses() },
      },
    }),
    prisma.syriaPayout.count({
      where: {
        escrowStatus: "RELEASED",
        booking: { AND: syriaBookingInvestorDemoExclusionClauses() },
      },
    }),
    prisma.syriaPayout.count({
      where: {
        escrowStatus: "BLOCKED",
        booking: { AND: syriaBookingInvestorDemoExclusionClauses() },
      },
    }),
  ]);

  return {
    totalPaymentAttempts: paymentAttempts,
    blockedPayments,
    webhookPaidCompletions,
    payoutsHeld: held,
    payoutsEligible: eligible,
    payoutsReleased: released,
    payoutsBlocked: blockedEscrow,
  };
}

/**
 * Recent SYBNB audit rows only — sanitized metadata.
 */
export async function getSybnbRecentEvents(limit = 20): Promise<SybnbMonitorEventRow[]> {
  const rows = await prisma.syriaSybnbCoreAudit.findMany({
    where: sybnbCoreAuditExcludeInvestorDemoWhere(),
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      event: true,
      createdAt: true,
      bookingId: true,
      metadata: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    kind: "audit" as const,
    event: r.event,
    createdAt: r.createdAt,
    bookingId: r.bookingId,
    summary: sanitizeMetadataLine(r.metadata),
  }));
}

/** Payment-like events in the last `windowMinutes` (for alert heuristics). */
export async function countPaymentEventsInWindow(windowMinutes: number): Promise<number> {
  const since = new Date(Date.now() - Math.max(1, windowMinutes) * 60_000);
  return prisma.syriaSybnbCoreAudit.count({
    where: {
      createdAt: { gte: since },
      event: { in: [...PAYMENT_ATTEMPT_EVENTS, "payment_intent_blocked", "checkout_payment_blocked"] },
      AND: [sybnbCoreAuditExcludeInvestorDemoWhere()],
    },
  });
}

export async function countBlockedPaymentEventsInWindow(windowMinutes: number): Promise<number> {
  const since = new Date(Date.now() - Math.max(1, windowMinutes) * 60_000);
  return prisma.syriaSybnbCoreAudit.count({
    where: {
      createdAt: { gte: since },
      event: { in: [...BLOCKED_PAYMENT_EVENTS] },
      AND: [sybnbCoreAuditExcludeInvestorDemoWhere()],
    },
  });
}

export async function countHighRiskBookingSignals(): Promise<number> {
  return prisma.syriaBooking.count({
    where: {
      riskStatus: "blocked",
      AND: syriaBookingInvestorDemoExclusionClauses(),
    },
  });
}

export async function countHighRiskPayoutRows(): Promise<number> {
  return prisma.syriaPayout.count({
    where: {
      riskStatus: { in: ["HIGH", "BLOCK"] },
      booking: { AND: syriaBookingInvestorDemoExclusionClauses() },
    },
  });
}

/**
 * Console-only alerts (no external channels). Safe metadata only.
 */
export async function evaluateSybnbMonitoringAlerts(): Promise<void> {
  const windowMin = 15;
  const [stats, burst, blockedBurst, riskBlocks, payoutRiskHot] = await Promise.all([
    getSybnbPaymentStats(),
    countPaymentEventsInWindow(windowMin),
    countBlockedPaymentEventsInWindow(windowMin),
    countHighRiskBookingSignals(),
    countHighRiskPayoutRows(),
  ]);

  if (burst > 5) {
    console.warn("[SYBNB ALERT]", {
      kind: "payment_attempt_burst",
      windowMinutes: windowMin,
      count: burst,
    });
  }
  if (blockedBurst >= 3) {
    console.warn("[SYBNB ALERT]", {
      kind: "blocked_payments_cluster",
      windowMinutes: windowMin,
      count: blockedBurst,
    });
  }
  if (stats.payoutsBlocked > 0) {
    console.warn("[SYBNB ALERT]", { kind: "payout_escrow_blocked_total", count: stats.payoutsBlocked });
  }
  if (riskBlocks > 0) {
    console.warn("[SYBNB ALERT]", { kind: "booking_risk_blocked_outstanding", count: riskBlocks });
  }
  if (payoutRiskHot > 0) {
    console.warn("[SYBNB ALERT]", { kind: "payout_risk_high_or_block_outstanding", count: payoutRiskHot });
  }
}
