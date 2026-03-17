/**
 * Observability and Platform Health – metrics, events, alerts, incidents.
 * Instrument key flows and expose health/ops dashboards.
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

/** Record a platform event (structured logging). */
export async function recordPlatformEvent(params: {
  eventType: string;
  entityType: string;
  entityId: string;
  payload?: object;
  region?: string;
}) {
  return prisma.platformEvent.create({
    data: {
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: (params.payload as object) ?? undefined,
      region: params.region,
    },
  });
}

/** Record a service health metric (e.g. from cron or health endpoint). */
export async function recordHealthMetric(params: {
  serviceName: string;
  metricName: string;
  value: number;
  unit?: string;
  region?: string;
}) {
  return prisma.serviceHealthMetric.create({
    data: {
      serviceName: params.serviceName,
      metricName: params.metricName,
      value: params.value,
      unit: params.unit,
      region: params.region,
    },
  });
}

/** Get latest metrics for a service (or all). */
export async function getLatestHealthMetrics(params?: { serviceName?: string; limit?: number }) {
  const where = params?.serviceName ? { serviceName: params.serviceName } : {};
  const raw = await prisma.serviceHealthMetric.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: (params?.limit ?? 100) * (params?.serviceName ? 1 : 10),
  });
  const byKey = new Map<string, { value: number; unit?: string | null; createdAt: Date }>();
  for (const m of raw) {
    const key = `${m.serviceName}:${m.metricName}${m.region ? `:${m.region}` : ""}`;
    if (!byKey.has(key)) byKey.set(key, { value: m.value, unit: m.unit, createdAt: m.createdAt });
  }
  return Array.from(byKey.entries()).map(([key, v]) => ({ key, ...v }));
}

/** Create a system alert (e.g. when threshold exceeded). */
export async function createSystemAlert(params: {
  alertType: string;
  severity: AlertSeverity;
  message: string;
  threshold?: number;
  currentValue?: number;
  metadata?: object;
}) {
  return prisma.systemAlert.create({
    data: {
      alertType: params.alertType,
      severity: params.severity,
      message: params.message,
      threshold: params.threshold,
      currentValue: params.currentValue,
      metadata: (params.metadata as object) ?? undefined,
    },
  });
}

/** Get unresolved alerts (for ops dashboard). */
export async function getActiveAlerts(limit = 50) {
  return prisma.systemAlert.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Resolve an alert. */
export async function resolveAlert(id: string, resolvedBy?: string) {
  return prisma.systemAlert.update({
    where: { id },
    data: { resolvedAt: new Date(), resolvedBy },
  });
}

/** Get alert counts by type (for spike detection). */
export async function getAlertCountsByType(since: Date) {
  const alerts = await prisma.systemAlert.findMany({
    where: { createdAt: { gte: since } },
    select: { alertType: true },
  });
  const counts: Record<string, number> = {};
  for (const a of alerts) {
    counts[a.alertType] = (counts[a.alertType] ?? 0) + 1;
  }
  return counts;
}

/** Get platform events (for funnel/debug). */
export async function getPlatformEvents(params: {
  eventType?: string;
  entityType?: string;
  since?: Date;
  limit?: number;
}) {
  const where: Prisma.PlatformEventWhereInput = {};
  if (params.eventType) where.eventType = params.eventType;
  if (params.entityType) where.entityType = params.entityType;
  if (params.since) where.createdAt = { gte: params.since };
  return prisma.platformEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 100,
  });
}

/** Create or update operational incident. */
export async function createOperationalIncident(params: {
  title: string;
  severity: string;
  description?: string;
  createdBy?: string;
}) {
  return prisma.operationalIncident.create({
    data: {
      title: params.title,
      severity: params.severity,
      description: params.description,
      createdBy: params.createdBy,
      status: "OPEN",
    },
  });
}

export async function getOperationalIncidents(params?: { status?: string; limit?: number }) {
  const where = params?.status ? { status: params.status } : {};
  return prisma.operationalIncident.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: params?.limit ?? 50,
  });
}

export async function resolveOperationalIncident(id: string, resolvedBy?: string) {
  return prisma.operationalIncident.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolvedBy },
  });
}

/** Aggregate counts for dashboard: bookings, payments, disputes, fraud signals (last 24h). */
export async function getPlatformHealthSnapshot() {
  const since = new Date();
  since.setDate(since.getDate() - 1);
  const [
    bookingsCreated,
    paymentsCompleted,
    paymentsFailed,
    disputesCreated,
    fraudSignalsCreated,
  ] = await Promise.all([
    prisma.booking.count({ where: { createdAt: { gte: since } } }),
    prisma.payment.count({ where: { status: "COMPLETED", createdAt: { gte: since } } }),
    prisma.payment.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
    prisma.dispute.count({ where: { createdAt: { gte: since } } }),
    prisma.fraudSignal.count({ where: { createdAt: { gte: since } } }),
  ]);
  return {
    since: since.toISOString(),
    bookingsCreated,
    paymentsCompleted,
    paymentsFailed,
    paymentFailureRate: paymentsCompleted + paymentsFailed > 0
      ? paymentsFailed / (paymentsCompleted + paymentsFailed)
      : 0,
    disputesCreated,
    fraudSignalsCreated,
  };
}
