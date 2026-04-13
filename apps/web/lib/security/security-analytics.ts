/**
 * Chart/search helpers for admin security — PostgreSQL aggregates on `platform_events`.
 */
import type { PrismaClient } from "@prisma/client";

export type HourlyCount = { t: string; count: number };

export async function getLoginFailureHourlySeries(
  prisma: PrismaClient,
  hours = 24
): Promise<HourlyCount[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const rows = await prisma.$queryRaw<{ bucket: Date; c: bigint }[]>`
    SELECT date_trunc('hour', created_at) AS bucket, COUNT(*)::bigint AS c
    FROM platform_events
    WHERE event_type = 'auth_login_failure'
      AND created_at >= ${since}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  return rows.map((r) => ({ t: r.bucket.toISOString(), count: Number(r.c) }));
}

export type TopFingerprintRow = { fingerprint: string; count: number; label: string };

export async function getTopFailedLoginFingerprints(
  prisma: PrismaClient,
  hours = 24,
  limit = 12
): Promise<TopFingerprintRow[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const rows = await prisma.platformEvent.groupBy({
    by: ["entityId"],
    where: {
      eventType: "auth_login_failure",
      createdAt: { gte: since },
      entityId: { not: null },
    },
    _count: { _all: true },
    orderBy: { _count: { entityId: "desc" } },
    take: limit,
  });
  return rows.map((r) => {
    const raw = r.entityId ?? "";
    const fingerprint = raw.startsWith("fp:") ? raw.slice(3) : raw;
    return {
      fingerprint,
      count: r._count._all,
      label: `${fingerprint.slice(0, 8)}…`,
    };
  });
}
