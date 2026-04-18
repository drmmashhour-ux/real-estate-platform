import {
  AccountStatus,
  ActionQueueItemStatus,
  AppointmentStatus,
  BrokerClientStatus,
  ClientIntakeStatus,
  DocumentFileStatus,
  NotificationStatus,
  NotificationType,
  OfferStatus,
  Prisma,
  RequiredDocumentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { LEASE_CONTRACT_STATUS } from "@/lib/hubs/contract-types";
import type {
  ActivityFeedItem,
  AdminDateRange,
  AdminDateRangePreset,
  Bottleneck,
  BottleneckSeverity,
  DashboardOverview,
  PendingActionGroup,
  PendingActionsSummary,
  TimeSeriesPoint,
  UsageMetrics,
  WorkflowFunnel,
} from "@/modules/analytics/types";

const MS_DAY = 86_400_000;

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse range from query: preset 7d|30d or from=YYYY-MM-DD&to=YYYY-MM-DD */
export function parseAdminRange(params: {
  range?: string | null;
  from?: string | null;
  to?: string | null;
}): AdminDateRange {
  const now = new Date();
  const end = startOfUtcDay(now);
  let start: Date = addUtcDays(end, -29);
  let preset: AdminDateRangePreset = "30d";

  if (params.from && params.to) {
    const a = new Date(`${params.from}T00:00:00.000Z`);
    const b = new Date(`${params.to}T00:00:00.000Z`);
    if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && a <= b) {
      start = a;
      end.setTime(b.getTime());
      preset = "custom";
      return { preset, from: isoDay(start), to: isoDay(addUtcDays(end, 1)) };
    }
  }

  const r = params.range ?? "30d";
  if (r === "7d") {
    preset = "7d";
    start = addUtcDays(end, -6);
  } else if (r === "90d") {
    preset = "90d";
    start = addUtcDays(end, -89);
  } else {
    preset = "30d";
    start = addUtcDays(end, -29);
  }

  return { preset, from: isoDay(start), to: isoDay(addUtcDays(end, 1)) };
}

function rangeWhere(fromIso: string, toIsoExclusive: string): Prisma.DateTimeFilter {
  return {
    gte: new Date(`${fromIso}T00:00:00.000Z`),
    lt: new Date(`${toIsoExclusive}T00:00:00.000Z`),
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * MS_DAY);

  const [
    totalUsers,
    activeUsers,
    totalClients,
    activeDeals,
    offerGroups,
    contractTotal,
    contractSigned,
    contractPending,
    contractCompleted,
    apptTotal,
    apptPending,
    apptCompleted,
    apptUpcoming,
    docTotal,
    portfolioDeals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { updatedAt: { gte: thirtyDaysAgo }, accountStatus: AccountStatus.ACTIVE } }),
    prisma.brokerClient.count(),
    prisma.brokerClient.count({
      where: {
        status: {
          in: [
            BrokerClientStatus.VIEWING,
            BrokerClientStatus.NEGOTIATING,
            BrokerClientStatus.UNDER_CONTRACT,
          ],
        },
      },
    }),
    prisma.offer.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contract.count(),
    prisma.contract.count({
      where: {
        OR: [
          { status: { equals: "signed", mode: "insensitive" } },
          { status: { equals: LEASE_CONTRACT_STATUS.SIGNED, mode: "insensitive" } },
        ],
      },
    }),
    prisma.contract.count({
      where: {
        OR: [
          { status: { equals: "pending", mode: "insensitive" } },
          { status: { equals: LEASE_CONTRACT_STATUS.SENT, mode: "insensitive" } },
          { status: { equals: "sent", mode: "insensitive" } },
        ],
        signatures: { some: { signedAt: null } },
      },
    }),
    prisma.contract.count({
      where: {
        OR: [
          { status: { equals: "completed", mode: "insensitive" } },
          { status: { equals: LEASE_CONTRACT_STATUS.COMPLETED, mode: "insensitive" } },
        ],
      },
    }),
    prisma.appointment.count(),
    prisma.appointment.count({
      where: { status: { in: [AppointmentStatus.PENDING, AppointmentStatus.RESCHEDULE_REQUESTED] } },
    }),
    prisma.appointment.count({ where: { status: AppointmentStatus.COMPLETED } }),
    prisma.appointment.count({
      where: {
        status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING] },
        startsAt: { gte: new Date() },
      },
    }),
    prisma.documentFile.count({ where: { status: DocumentFileStatus.AVAILABLE } }),
    prisma.investmentDeal.count().catch(() => 0),
  ]);

  const offerMap = Object.fromEntries(offerGroups.map((g) => [g.status, g._count._all])) as Record<
    string,
    number
  >;

  return {
    users: { total: totalUsers, active: activeUsers },
    clients: { total: totalClients },
    deals: { active: activeDeals },
    offers: {
      total: offerGroups.reduce((s, g) => s + g._count._all, 0),
      submitted: offerMap[OfferStatus.SUBMITTED] ?? 0,
      underReview: offerMap[OfferStatus.UNDER_REVIEW] ?? 0,
      accepted: offerMap[OfferStatus.ACCEPTED] ?? 0,
      rejected: offerMap[OfferStatus.REJECTED] ?? 0,
      countered: offerMap[OfferStatus.COUNTERED] ?? 0,
    },
    contracts: {
      total: contractTotal,
      signed: contractSigned,
      pending: contractPending,
      completed: contractCompleted,
    },
    appointments: {
      total: apptTotal,
      pending: apptPending,
      completed: apptCompleted,
      upcoming: apptUpcoming,
    },
    documents: { total: docTotal },
    portfolio: { investmentDeals: portfolioDeals },
  };
}

export async function getWorkflowFunnel(): Promise<WorkflowFunnel> {
  const [
    lead,
    qualified,
    viewing,
    negotiating,
    offerSubmitted,
    offerAccepted,
    contractsCreated,
    contractsSigned,
    closed,
  ] = await Promise.all([
    prisma.brokerClient.count({ where: { status: BrokerClientStatus.LEAD } }),
    prisma.brokerClient.count({ where: { status: BrokerClientStatus.QUALIFIED } }),
    prisma.brokerClient.count({ where: { status: BrokerClientStatus.VIEWING } }),
    prisma.brokerClient.count({ where: { status: BrokerClientStatus.NEGOTIATING } }),
    prisma.offer.count({
      where: { status: { in: [OfferStatus.SUBMITTED, OfferStatus.UNDER_REVIEW, OfferStatus.COUNTERED] } },
    }),
    prisma.offer.count({ where: { status: OfferStatus.ACCEPTED } }),
    prisma.contract.count(),
    prisma.contract.count({
      where: {
        OR: [
          { signedAt: { not: null } },
          { status: { contains: "signed", mode: "insensitive" } },
          { status: { contains: "completed", mode: "insensitive" } },
        ],
      },
    }),
    prisma.brokerClient.count({ where: { status: BrokerClientStatus.CLOSED } }),
  ]);

  const stagesRaw = [
    { name: "Lead", count: lead },
    { name: "Qualified", count: qualified },
    { name: "Viewing", count: viewing },
    { name: "Negotiating", count: negotiating },
    { name: "Offer submitted", count: offerSubmitted },
    { name: "Offer accepted", count: offerAccepted },
    { name: "Contract created", count: contractsCreated },
    { name: "Contract signed / done", count: contractsSigned },
    { name: "Closed (CRM)", count: closed },
  ];

  const stages = stagesRaw.map((s, i) => {
    const prev = i === 0 ? null : stagesRaw[i - 1]!.count;
    const conversionRate =
      prev === null || prev === 0 ? null : Math.min(100, Math.round((s.count / prev) * 1000) / 10);
    return { name: s.name, count: s.count, conversionRate };
  });

  return { stages };
}

export async function getPendingActionsSummary(): Promise<PendingActionsSummary> {
  const [
    docsReview,
    offersReview,
    contractsSign,
    apptConfirm,
    unreadNotif,
    intakeIncomplete,
    actionQueueOpen,
  ] = await Promise.all([
    prisma.requiredDocumentItem.count({
      where: {
        deletedAt: null,
        status: { in: [RequiredDocumentStatus.UPLOADED, RequiredDocumentStatus.UNDER_REVIEW] },
      },
    }),
    prisma.offer.count({
      where: { status: { in: [OfferStatus.SUBMITTED, OfferStatus.UNDER_REVIEW] } },
    }),
    prisma.contract.count({
      where: {
        signatures: { some: { signedAt: null } },
        status: { notIn: ["cancelled", LEASE_CONTRACT_STATUS.CANCELLED] },
      },
    }),
    prisma.appointment.count({
      where: { status: { in: [AppointmentStatus.PENDING, AppointmentStatus.RESCHEDULE_REQUESTED] } },
    }),
    prisma.notification.count({
      where: { status: NotificationStatus.UNREAD, type: NotificationType.MESSAGE },
    }),
    prisma.clientIntakeProfile.count({
      where: { status: { not: ClientIntakeStatus.COMPLETE } },
    }),
    prisma.actionQueueItem.count({
      where: { status: { in: [ActionQueueItemStatus.OPEN, ActionQueueItemStatus.IN_PROGRESS] } },
    }),
  ]);

  const groups: PendingActionGroup[] = [
    {
      key: "documents_review",
      label: "Documents pending review",
      count: docsReview,
      urgency: docsReview > 20 ? "high" : docsReview > 5 ? "medium" : "low",
    },
    {
      key: "offers_review",
      label: "Offers awaiting review",
      count: offersReview,
      urgency: offersReview > 15 ? "high" : offersReview > 3 ? "medium" : "low",
    },
    {
      key: "contracts_sign",
      label: "Contracts awaiting signature",
      count: contractsSign,
      urgency: contractsSign > 10 ? "high" : contractsSign > 2 ? "medium" : "low",
    },
    {
      key: "appointments_confirm",
      label: "Appointments awaiting confirmation",
      count: apptConfirm,
      urgency: apptConfirm > 8 ? "high" : apptConfirm > 2 ? "medium" : "low",
    },
    {
      key: "unread_messages",
      label: "Unread message notifications (platform)",
      count: unreadNotif,
      urgency: unreadNotif > 100 ? "high" : unreadNotif > 20 ? "medium" : "low",
    },
    {
      key: "intake_incomplete",
      label: "Intake profiles not complete",
      count: intakeIncomplete,
      urgency: intakeIncomplete > 30 ? "high" : intakeIncomplete > 8 ? "medium" : "low",
    },
    {
      key: "action_queue",
      label: "Open action queue items",
      count: actionQueueOpen,
      urgency: actionQueueOpen > 50 ? "high" : actionQueueOpen > 10 ? "medium" : "low",
    },
  ];

  return {
    groups,
    total: groups.reduce((s, g) => s + g.count, 0),
  };
}

export async function getUsageMetrics(range: AdminDateRange): Promise<UsageMetrics> {
  const w = rangeWhere(range.from, range.to);

  const [messagesSent, documentsUploaded, offersCreated, contractsGenerated, appointmentsBooked] =
    await Promise.all([
      prisma.message.count({ where: { createdAt: w, deletedAt: null } }),
      prisma.documentFile.count({ where: { createdAt: w } }),
      prisma.offer.count({ where: { createdAt: w } }),
      prisma.contract.count({ where: { createdAt: w } }),
      prisma.appointment.count({ where: { createdAt: w } }),
    ]);

  const [msgByUserRaw, brokerMsgsRaw] = await Promise.all([
    prisma.message.groupBy({
      by: ["senderId"],
      where: { createdAt: w, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.message.groupBy({
      by: ["senderId"],
      where: {
        createdAt: w,
        deletedAt: null,
        sender: { role: "BROKER" },
      },
      _count: { _all: true },
    }),
  ]);

  const msgByUser = [...msgByUserRaw].sort((a, b) => b._count._all - a._count._all).slice(0, 8);
  const brokerMsgs = [...brokerMsgsRaw].sort((a, b) => b._count._all - a._count._all).slice(0, 8);

  const userIds = [...new Set([...msgByUser.map((m) => m.senderId), ...brokerMsgs.map((m) => m.senderId)])];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const umap = Object.fromEntries(users.map((u) => [u.id, u]));

  const mapTop = (rows: typeof msgByUser) =>
    rows.map((r) => ({
      userId: r.senderId,
      name: umap[r.senderId]?.name ?? null,
      email: umap[r.senderId]?.email ?? "",
      count: r._count._all,
    }));

  return {
    range,
    messagesSent,
    documentsUploaded,
    offersCreated,
    contractsGenerated,
    appointmentsBooked,
    mostActiveUsers: mapTop(msgByUser).slice(0, 5),
    mostActiveBrokers: mapTop(brokerMsgs).slice(0, 5),
  };
}

function severityFrom(count: number, avgHours: number | null): BottleneckSeverity {
  const h = avgHours ?? 0;
  if (count >= 25 || h >= 168) return "HIGH";
  if (count >= 8 || h >= 72) return "MEDIUM";
  return "LOW";
}

export async function getBottlenecks(): Promise<Bottleneck[]> {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * MS_DAY);
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_DAY);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * MS_DAY);

  const [
    offersStuck,
    offerStuckRows,
    contractsStale,
    contractRows,
    intakeStale,
    apptUnconfirmed,
    docsStale,
    docRows,
  ] = await Promise.all([
    prisma.offer.count({
      where: { status: OfferStatus.UNDER_REVIEW, updatedAt: { lt: threeDaysAgo } },
    }),
    prisma.offer.findMany({
      where: { status: OfferStatus.UNDER_REVIEW, updatedAt: { lt: threeDaysAgo } },
      select: { updatedAt: true },
      take: 500,
    }),
    prisma.contract.count({
      where: {
        status: { in: [LEASE_CONTRACT_STATUS.SENT, "sent", "pending"] },
        updatedAt: { lt: sevenDaysAgo },
        signatures: { some: { signedAt: null } },
      },
    }),
    prisma.contract.findMany({
      where: {
        status: { in: [LEASE_CONTRACT_STATUS.SENT, "sent", "pending"] },
        updatedAt: { lt: sevenDaysAgo },
        signatures: { some: { signedAt: null } },
      },
      select: { updatedAt: true },
      take: 500,
    }),
    prisma.clientIntakeProfile.count({
      where: {
        status: { not: ClientIntakeStatus.COMPLETE },
        updatedAt: { lt: fourteenDaysAgo },
      },
    }),
    prisma.appointment.count({
      where: {
        status: AppointmentStatus.PENDING,
        startsAt: { lt: now },
      },
    }),
    prisma.requiredDocumentItem.count({
      where: {
        deletedAt: null,
        status: RequiredDocumentStatus.UNDER_REVIEW,
        updatedAt: { lt: sevenDaysAgo },
      },
    }),
    prisma.requiredDocumentItem.findMany({
      where: {
        deletedAt: null,
        status: RequiredDocumentStatus.UNDER_REVIEW,
        updatedAt: { lt: sevenDaysAgo },
      },
      select: { updatedAt: true },
      take: 500,
    }),
  ]);

  const avgHours = (rows: { updatedAt: Date }[]) => {
    if (rows.length === 0) return null;
    const sum = rows.reduce((s, r) => s + (now.getTime() - r.updatedAt.getTime()), 0);
    return sum / rows.length / 3_600_000;
  };

  const out: Bottleneck[] = [
    {
      type: "offer_under_review",
      label: "Offers stuck in under review (>3d)",
      count: offersStuck,
      avgDelayHours: avgHours(offerStuckRows),
      severity: severityFrom(offersStuck, avgHours(offerStuckRows)),
    },
    {
      type: "contract_unsigned",
      label: "Contracts awaiting signature (>7d since update)",
      count: contractsStale,
      avgDelayHours: avgHours(contractRows),
      severity: severityFrom(contractsStale, avgHours(contractRows)),
    },
    {
      type: "intake_incomplete",
      label: "Intake not completed (>14d since update)",
      count: intakeStale,
      avgDelayHours: null,
      severity: severityFrom(intakeStale, null),
    },
    {
      type: "appointment_unconfirmed",
      label: "Appointments still pending after start time",
      count: apptUnconfirmed,
      avgDelayHours: null,
      severity: severityFrom(apptUnconfirmed, null),
    },
    {
      type: "document_review",
      label: "Documents under review (>7d)",
      count: docsStale,
      avgDelayHours: avgHours(docRows),
      severity: severityFrom(docsStale, avgHours(docRows)),
    },
  ];

  return out;
}

export async function getTimeSeriesMetrics(range: AdminDateRange): Promise<TimeSeriesPoint[]> {
  const start = new Date(`${range.from}T00:00:00.000Z`);
  const endEx = new Date(`${range.to}T00:00:00.000Z`);
  const days: string[] = [];
  for (let d = new Date(start); d < endEx; d = addUtcDays(d, 1)) {
    days.push(isoDay(d));
  }

  const w = rangeWhere(range.from, range.to);

  const [users, clients, offers, contracts, appts, docs] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: w },
      select: { createdAt: true },
    }),
    prisma.brokerClient.findMany({
      where: { createdAt: w },
      select: { createdAt: true },
    }),
    prisma.offer.findMany({
      where: { createdAt: w },
      select: { createdAt: true },
    }),
    prisma.contract.findMany({
      where: { signedAt: w },
      select: { signedAt: true },
    }),
    prisma.appointment.findMany({
      where: { createdAt: w },
      select: { createdAt: true },
    }),
    prisma.documentFile.findMany({
      where: { createdAt: w },
      select: { createdAt: true },
    }),
  ]);

  const bucket = (rows: { createdAt?: Date; updatedAt?: Date }[], use: "c" | "u") => {
    const m = new Map<string, number>();
    for (const day of days) m.set(day, 0);
    for (const r of rows) {
      const dt = use === "c" ? r.createdAt : r.updatedAt;
      if (!dt) continue;
      const key = isoDay(startOfUtcDay(dt));
      if (m.has(key)) m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  };

  const bu = bucket(
    users.map((x) => ({ createdAt: x.createdAt })),
    "c"
  );
  const bc = bucket(
    clients.map((x) => ({ createdAt: x.createdAt })),
    "c"
  );
  const bo = bucket(
    offers.map((x) => ({ createdAt: x.createdAt })),
    "c"
  );
  const bct = bucket(
    contracts.map((x) => ({ createdAt: x.signedAt ?? undefined })),
    "c"
  );
  const ba = bucket(
    appts.map((x) => ({ createdAt: x.createdAt })),
    "c"
  );
  const bd = bucket(
    docs.map((x) => ({ createdAt: x.createdAt })),
    "c"
  );

  return days.map((date) => ({
    date,
    newUsers: bu.get(date) ?? 0,
    newClients: bc.get(date) ?? 0,
    offersCreated: bo.get(date) ?? 0,
    contractsSigned: bct.get(date) ?? 0,
    appointmentsBooked: ba.get(date) ?? 0,
    documentsUploaded: bd.get(date) ?? 0,
  }));
}

export async function getRecentActivityFeed(take = 25): Promise<ActivityFeedItem[]> {
  const [offers, contracts, appts, files, intakeEvents, demo] = await Promise.all([
    prisma.offer.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        createdAt: true,
        listingId: true,
      },
    }),
    prisma.contract.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, status: true, updatedAt: true, signedAt: true },
    }),
    prisma.appointment.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, status: true, createdAt: true },
    }),
    prisma.documentFile.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, originalName: true, createdAt: true },
    }),
    prisma.clientIntakeEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { type: true, message: true, createdAt: true, brokerClientId: true },
    }),
    prisma.demoEvent
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        select: { event: true, metadata: true, createdAt: true },
      })
      .catch(() => [] as { event: string; metadata: unknown; createdAt: Date }[]),
  ]);

  const items: ActivityFeedItem[] = [];

  for (const o of offers) {
    items.push({
      type: "offer",
      message: `Offer ${o.status} (listing ${o.listingId.slice(0, 8)}…)`,
      timestamp: o.createdAt.toISOString(),
      link: `/dashboard/offers/${o.id}`,
    });
  }
  for (const c of contracts) {
    items.push({
      type: "contract",
      message: c.signedAt
        ? `Contract signed: ${c.title || "Agreement"}`
        : `Contract updated: ${c.title || c.id.slice(0, 8)} (${c.status})`,
      timestamp: (c.signedAt ?? c.updatedAt).toISOString(),
      link: `/dashboard/contracts?highlight=${encodeURIComponent(c.id)}`,
    });
  }
  for (const a of appts) {
    items.push({
      type: "appointment",
      message: `${a.title} — ${a.status}`,
      timestamp: a.createdAt.toISOString(),
      link: `/dashboard/appointments/${a.id}`,
    });
  }
  for (const f of files) {
    items.push({
      type: "document",
      message: `Document uploaded: ${f.originalName}`,
      timestamp: f.createdAt.toISOString(),
      link: `/dashboard/documents?fileId=${encodeURIComponent(f.id)}`,
    });
  }
  for (const e of intakeEvents) {
    items.push({
      type: "intake",
      message: e.message ?? `Intake event: ${e.type}`,
      timestamp: e.createdAt.toISOString(),
      link: `/dashboard/broker/intake/${e.brokerClientId}`,
    });
  }
  for (const d of demo) {
    items.push({
      type: "demo_event",
      message: d.event,
      timestamp: d.createdAt.toISOString(),
      link: null,
    });
  }

  items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return items.slice(0, take);
}
