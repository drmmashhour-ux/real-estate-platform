import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import {
  BLOCKED_PAYMENT_EVENTS,
  PAYMENT_ATTEMPT_EVENTS,
  getSybnbPaymentStats,
} from "@/lib/sybnb/monitoring";
import { sybnbCoreAuditExcludeInvestorDemoWhere } from "@/lib/sybnb/demo-metrics-filter";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Hourly DR.BRAIN metrics for Syria SYBNB / payouts (UTC buckets, last 24h).
 *
 * Source mapping (requested conceptual names → actual Postgres tables):
 * - Payment attempts → `syria_sybnb_core_audit` (intent-style events)
 * - Financial audit trails → `syria_sybnb_core_audit` + `syria_payment_audit_log`
 * - Payout escrow snapshot → `syria_payouts` (`SyriaPayout`)
 */
export type DrBrainMetrics = {
  paymentAttempts: number[];
  blockedPayments: number[];
  payouts: {
    held: number;
    eligible: number;
    released: number;
    blocked: number;
  };
  anomalyScores: number[];
  errorRate: number[];
  timestamps: string[];
};

function bucketKeyMs(d: Date): number {
  return Math.floor(d.getTime() / HOUR_MS) * HOUR_MS;
}

function anomalyFromBuckets(a: number, b: number, apiish: number, total: number, f1Audit: number): number {
  const ratio = a > 0 ? b / (a + 1) : 0;
  const core = Math.min(100, b * 6 + apiish * 4 + ratio * 40);
  const f1Bump = Math.min(25, f1Audit * 4);
  return Math.round(Math.min(100, core + f1Bump) * 10) / 10;
}

function errorRateBlend(corePct: number, f1Count: number): number {
  const f1Norm = Math.min(100, f1Count * 12);
  const blended = corePct * 0.62 + f1Norm * 0.38;
  return Math.round(Math.min(100, blended) * 10) / 10;
}

/** Audit rows matching error-ish patterns (SYBNB core + F1 audit volume proxy), last 24h UTC — public dashboard helper. */
export async function countDrBrainApiLikeSignals24h(): Promise<number> {
  const since = new Date(Date.now() - 24 * HOUR_MS);
  const attemptList = [...PAYMENT_ATTEMPT_EVENTS];
  const blockedList = [...BLOCKED_PAYMENT_EVENTS];
  const [coreLike, f1Count] = await Promise.all([
    prisma.syriaSybnbCoreAudit.count({
      where: {
        createdAt: { gte: since },
        AND: [
          sybnbCoreAuditExcludeInvestorDemoWhere(),
          {
            OR: [
              { event: { contains: "error", mode: "insensitive" } },
              { event: { contains: "failed", mode: "insensitive" } },
              { event: { contains: "denied", mode: "insensitive" } },
            ],
          },
        ],
      },
    }),
    prisma.syriaPaymentAuditLog.count({ where: { createdAt: { gte: since } } }),
  ]);
  return coreLike + f1Count;
}

export async function getDrBrainMetrics(): Promise<DrBrainMetrics> {
  const attemptList = [...PAYMENT_ATTEMPT_EVENTS];
  const blockedList = [...BLOCKED_PAYMENT_EVENTS];

  const [coreRows, f1Rows, payoutSnapshot] = await Promise.all([
    prisma.$queryRaw<
      Array<{ bucket: Date; attempts: bigint; blocked: bigint; apiish: bigint; total: bigint }>
    >`
      SELECT
        date_trunc('hour', created_at) AS bucket,
        COUNT(*) FILTER (WHERE event IN (${Prisma.join(attemptList)}))::bigint AS attempts,
        COUNT(*) FILTER (WHERE event IN (${Prisma.join(blockedList)}))::bigint AS blocked,
        COUNT(*) FILTER (
          WHERE event ILIKE '%error%'
             OR event ILIKE '%failed%'
             OR event ILIKE '%denied%'
        )::bigint AS apiish,
        COUNT(*)::bigint AS total
      FROM syria_sybnb_core_audit
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND (metadata IS NULL OR NOT (COALESCE(metadata, '{}'::jsonb) @> '{"demo": true}'::jsonb))
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.$queryRaw<Array<{ bucket: Date; n: bigint }>>`
      SELECT date_trunc('hour', created_at) AS bucket, COUNT(*)::bigint AS n
      FROM syria_payment_audit_log
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    getSybnbPaymentStats(),
  ]);

  const coreMap = new Map<number, { attempts: number; blocked: number; apiish: number; total: number }>();
  for (const r of coreRows) {
    const k = bucketKeyMs(new Date(r.bucket));
    coreMap.set(k, {
      attempts: Number(r.attempts),
      blocked: Number(r.blocked),
      apiish: Number(r.apiish),
      total: Number(r.total),
    });
  }

  const f1Map = new Map<number, number>();
  for (const r of f1Rows) {
    const k = bucketKeyMs(new Date(r.bucket));
    f1Map.set(k, Number(r.n));
  }

  const endHour = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
  const startHour = endHour - 23 * HOUR_MS;

  const paymentAttempts: number[] = [];
  const blockedPayments: number[] = [];
  const anomalyScores: number[] = [];
  const errorRate: number[] = [];
  const timestamps: string[] = [];

  for (let t = startHour; t <= endHour; t += HOUR_MS) {
    timestamps.push(new Date(t).toISOString());
    const d = coreMap.get(t) ?? { attempts: 0, blocked: 0, apiish: 0, total: 0 };
    const f1n = f1Map.get(t) ?? 0;
    paymentAttempts.push(d.attempts);
    blockedPayments.push(d.blocked);
    anomalyScores.push(anomalyFromBuckets(d.attempts, d.blocked, d.apiish, d.total, f1n));
    const corePct = d.total > 0 ? Math.min(100, (d.apiish / d.total) * 100) : 0;
    errorRate.push(errorRateBlend(corePct, f1n));
  }

  return {
    paymentAttempts,
    blockedPayments,
    payouts: {
      held: payoutSnapshot.payoutsHeld,
      eligible: payoutSnapshot.payoutsEligible,
      released: payoutSnapshot.payoutsReleased,
      blocked: payoutSnapshot.payoutsBlocked,
    },
    anomalyScores,
    errorRate,
    timestamps,
  };
}
