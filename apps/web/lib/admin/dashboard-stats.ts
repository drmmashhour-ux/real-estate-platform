import { BookingStatus, ListingStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const OPEN_DISPUTE_STATUSES = [
  "OPEN",
  "SUBMITTED",
  "UNDER_REVIEW",
  "WAITING_FOR_HOST_RESPONSE",
  "EVIDENCE_REVIEW",
  "ESCALATED",
] as const;

export type AdminDashboardStats = {
  activeListings: number;
  confirmedBookings: number;
  grossPlatformRevenueCents: number;
  pendingPayoutsCents: number;
  openDisputes: number;
  newUsersThisMonth: number;
  trends: {
    listings: "up" | "down" | "flat";
    bookings: "up" | "down" | "flat";
    revenue: "up" | "down" | "flat";
    payouts: "up" | "down" | "flat";
    disputes: "up" | "down" | "flat";
    users: "up" | "down" | "flat";
  };
};

function trend(cur: number, prev: number): "up" | "down" | "flat" {
  if (prev === 0) return cur > 0 ? "up" : "flat";
  const d = (cur - prev) / prev;
  if (d > 0.02) return "up";
  if (d < -0.02) return "down";
  return "flat";
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  const som = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevSom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEom = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [
    activeListings,
    listingsCreatedPrevMonth,
    confirmedBookings,
    bookingsConfirmedPrevMonth,
    grossAgg,
    pendingAgg,
    prevPendingAgg,
    openDisputes,
    disputesOpenedThisMonth,
    disputesOpenedPrevMonth,
    newUsers,
    prevNewUsers,
  ] = await Promise.all([
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } }),
    prisma.shortTermListing.count({
      where: { createdAt: { gte: prevSom, lt: som } },
    }),
    prisma.booking.count({
      where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
    }),
    prisma.booking.count({
      where: {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        createdAt: { gte: prevSom, lt: som },
      },
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED },
      _sum: { amountCents: true },
    }),
    prisma.bnhubHostPayoutRecord.aggregate({
      where: {
        payoutStatus: { in: ["PENDING", "HELD", "SCHEDULED"] },
      },
      _sum: { netAmountCents: true },
    }),
    prisma.bnhubHostPayoutRecord.aggregate({
      where: {
        payoutStatus: { in: ["PENDING", "HELD", "SCHEDULED"] },
        createdAt: { lt: som },
      },
      _sum: { netAmountCents: true },
    }),
    prisma.dispute.count({ where: { status: { in: [...OPEN_DISPUTE_STATUSES] } } }),
    prisma.dispute.count({ where: { createdAt: { gte: som } } }),
    prisma.dispute.count({ where: { createdAt: { gte: prevSom, lt: som } } }),
    prisma.user.count({ where: { createdAt: { gte: som } } }),
    prisma.user.count({
      where: { createdAt: { gte: prevSom, lt: som } },
    }),
  ]);

  const grossPlatformRevenueCents = grossAgg._sum.amountCents ?? 0;
  const [monthGross, prevMonthGross, listingsCreatedThisMonth, bookingsConfirmedThisMonth] =
    await Promise.all([
      prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED, paidAt: { gte: som } },
        _sum: { amountCents: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: prevSom, lte: prevEom },
        },
        _sum: { amountCents: true },
      }),
      prisma.shortTermListing.count({ where: { createdAt: { gte: som } } }),
      prisma.booking.count({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          createdAt: { gte: som },
        },
      }),
    ]);

  const pendingPayoutsCents = pendingAgg._sum.netAmountCents ?? 0;
  const prevPending = prevPendingAgg._sum.netAmountCents ?? 0;

  return {
    activeListings,
    confirmedBookings,
    grossPlatformRevenueCents,
    pendingPayoutsCents,
    openDisputes,
    newUsersThisMonth: newUsers,
    trends: {
      listings: trend(listingsCreatedThisMonth, listingsCreatedPrevMonth),
      bookings: trend(bookingsConfirmedThisMonth, bookingsConfirmedPrevMonth),
      revenue: trend(monthGross._sum.amountCents ?? 0, prevMonthGross._sum.amountCents ?? 0),
      payouts: trend(pendingPayoutsCents, prevPending),
      disputes: trend(disputesOpenedThisMonth, disputesOpenedPrevMonth),
      users: trend(newUsers, prevNewUsers),
    },
  };
}

export type AdminActivityItem = {
  id: string;
  kind: string;
  label: string;
  detail: string;
  at: Date;
  href?: string;
};

/** Recent platform events for the admin home feed (best-effort, multiple sources). */
export async function getAdminActivityFeed(take = 24): Promise<AdminActivityItem[]> {
  const [listings, bookings, refunds, payouts, disputes, engine, hostApproved, canceledBookings] = await Promise.all([
    prisma.shortTermListing.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        createdAt: true,
        listingStatus: true,
        owner: { select: { email: true } },
      },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        createdAt: true,
        listing: { select: { title: true } },
      },
    }),
    prisma.payment.findMany({
      where: { status: { in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED] } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, updatedAt: true, bookingId: true },
    }),
    prisma.bnhubHostPayoutRecord.findMany({
      where: { payoutStatus: "PAID" },
      orderBy: { releasedAt: "desc" },
      take: 6,
      select: { id: true, releasedAt: true, netAmountCents: true, bookingId: true },
    }),
    prisma.dispute.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, status: true, createdAt: true, bookingId: true },
    }),
    prisma.bnhubEngineAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, decisionType: true, createdAt: true, listingId: true },
    }),
    prisma.bnhubHost.findMany({
      where: { status: "approved" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, updatedAt: true, user: { select: { email: true } } },
    }),
    prisma.booking.findMany({
      where: {
        status: {
          in: [
            BookingStatus.CANCELLED,
            BookingStatus.CANCELLED_BY_GUEST,
            BookingStatus.CANCELLED_BY_HOST,
          ],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        listing: { select: { title: true } },
      },
    }),
  ]);

  const out: AdminActivityItem[] = [];

  for (const l of listings) {
    out.push({
      id: `lst-${l.id}`,
      kind: "listing",
      label: "Listing activity",
      detail: `${l.listingStatus}: ${l.title.slice(0, 48)}${l.owner?.email ? ` · ${l.owner.email}` : ""}`,
      at: l.createdAt,
      href: `/admin/listings/stays`,
    });
  }
  for (const b of bookings) {
    out.push({
      id: `bkg-${b.id}`,
      kind: "booking",
      label: `Booking ${b.status}`,
      detail: b.listing.title.slice(0, 60),
      at: b.createdAt,
      href: `/bnhub/booking/${b.id}`,
    });
  }
  for (const r of refunds) {
    out.push({
      id: `ref-${r.id}`,
      kind: "refund",
      label: "Refund issued",
      detail: `Payment ${r.id.slice(0, 8)}…`,
      at: r.updatedAt,
      href: `/admin/bookings`,
    });
  }
  for (const p of payouts) {
    out.push({
      id: `pay-${p.id}`,
      kind: "payout",
      label: "Payout released",
      detail: `Net ${(p.netAmountCents / 100).toFixed(0)} (minor units)`,
      at: p.releasedAt ?? new Date(),
      href: `/admin/payouts`,
    });
  }
  for (const d of disputes) {
    out.push({
      id: `dsp-${d.id}`,
      kind: "dispute",
      label: `Dispute ${d.status}`,
      detail: `Booking ${d.bookingId.slice(0, 8)}…`,
      at: d.createdAt,
      href: `/admin/disputes`,
    });
  }
  for (const e of engine) {
    out.push({
      id: `eng-${e.id}`,
      kind: "ai",
      label: `AI engine: ${e.decisionType}`,
      detail: e.listingId ? `Listing ${e.listingId.slice(0, 8)}…` : "Platform",
      at: e.createdAt,
      href: `/admin/ai`,
    });
  }
  for (const h of hostApproved) {
    out.push({
      id: `host-${h.id}`,
      kind: "host",
      label: "Host onboarding completed",
      detail: `${h.name ?? "Host"}${h.user?.email ? ` · ${h.user.email}` : ""}`,
      at: h.updatedAt,
      href: `/admin/hosts`,
    });
  }
  for (const c of canceledBookings) {
    out.push({
      id: `cncl-${c.id}`,
      kind: "cancel",
      label: `Booking canceled (${c.status})`,
      detail: c.listing.title.slice(0, 60),
      at: c.updatedAt,
      href: `/bnhub/booking/${c.id}`,
    });
  }

  out.sort((a, b) => b.at.getTime() - a.at.getTime());
  return out.slice(0, take);
}

export type AdminListingsHealth = {
  draft: number;
  published: number;
  paused: number;
  flagged: number;
  missingPhotos: number;
  weakDescriptions: number;
};

export async function getAdminListingsHealth(): Promise<AdminListingsHealth> {
  const [draft, published, paused, flagged, withPhotos] = await Promise.all([
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.DRAFT } }),
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } }),
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.UNLISTED } }),
    prisma.shortTermListing.count({
      where: {
        listingStatus: { in: [ListingStatus.UNDER_INVESTIGATION, ListingStatus.SUSPENDED, ListingStatus.FROZEN] },
      },
    }),
    prisma.shortTermListing.findMany({
      where: { listingStatus: ListingStatus.PUBLISHED },
      select: {
        id: true,
        description: true,
        _count: { select: { listingPhotos: true } },
      },
      take: 500,
    }),
  ]);

  let missingPhotos = 0;
  let weakDescriptions = 0;
  for (const l of withPhotos) {
    if (l._count.listingPhotos < 1) missingPhotos += 1;
    const d = (l.description ?? "").trim();
    if (d.length > 0 && d.length < 120) weakDescriptions += 1;
  }

  return { draft, published, paused, flagged, missingPhotos, weakDescriptions };
}

export type AdminBookingHealth = {
  pending: number;
  confirmed: number;
  failedPayments: number;
  canceled: number;
  refundVolumeCents: number;
};

export async function getAdminBookingHealth(): Promise<AdminBookingHealth> {
  const canceledStatuses: BookingStatus[] = [
    BookingStatus.CANCELLED,
    BookingStatus.CANCELLED_BY_GUEST,
    BookingStatus.CANCELLED_BY_HOST,
  ];

  const [pending, confirmed, canceled, failedPayments, refundVol] = await Promise.all([
    prisma.booking.count({
      where: { status: { in: [BookingStatus.PENDING, BookingStatus.AWAITING_HOST_APPROVAL] } },
    }),
    prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
    prisma.booking.count({ where: { status: { in: canceledStatuses } } }),
    prisma.booking.count({
      where: { payment: { status: PaymentStatus.FAILED } },
    }),
    prisma.payment.aggregate({
      where: { status: { in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED] } },
      _sum: { amountCents: true },
    }),
  ]);

  return {
    pending,
    confirmed,
    failedPayments,
    canceled,
    refundVolumeCents: refundVol._sum.amountCents ?? 0,
  };
}

export type AdminAiOpsSummary = {
  /** Engine audit rows today (proxy for “AI suggestions generated”). */
  suggestionsToday: number;
  autopilotActions: number;
  pricingRecommendationsPending: number;
  descriptionImprovementsPending: number;
  listingCompletenessPending: number;
  promotionSuggestionsPending: number;
  failedTasks: number;
};

export async function getAdminAiOps(): Promise<AdminAiOpsSummary> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [suggestionsToday, autopilotActions, failedTasks, pricingRecommendationsPending, descriptionImprovementsPending, listingCompletenessPending, promotionSuggestionsPending] =
    await Promise.all([
      prisma.bnhubEngineAuditLog.count({ where: { createdAt: { gte: start } } }),
      prisma.bnhubEngineAuditLog.count({
        where: {
          createdAt: { gte: start },
          OR: [
            { decisionType: { startsWith: "AUTO_" } },
            { source: { equals: "autopilot" } },
          ],
        },
      }).catch(() => 0),
      prisma.bnhubEngineAuditLog.count({
        where: {
          createdAt: { gte: start },
          OR: [
            { decisionType: { contains: "fail" } },
            { decisionType: { contains: "error" } },
          ],
        },
      }).catch(() => 0),
      prisma.shortTermListing.count({
        where: {
          listingStatus: ListingStatus.PUBLISHED,
          nightPriceCents: { lt: 5000 },
        },
      }),
      prisma.shortTermListing.count({
        where: {
          listingStatus: ListingStatus.PUBLISHED,
          OR: [{ description: null }, { description: "" }],
        },
      }),
      prisma.shortTermListing.count({
        where: {
          listingStatus: ListingStatus.PUBLISHED,
          listingPhotos: { none: {} },
        },
      }),
      prisma.bnhubHostListingPromotion.count({
        where: {
          active: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      }),
    ]);

  return {
    suggestionsToday,
    autopilotActions,
    pricingRecommendationsPending,
    descriptionImprovementsPending,
    listingCompletenessPending,
    promotionSuggestionsPending,
    failedTasks,
  };
}

export type AdminRiskAlert = {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
  href: string;
};

export async function getAdminRiskAlerts(): Promise<AdminRiskAlert[]> {
  const alerts: AdminRiskAlert[] = [];

  const [suspiciousUsers, highCancelHosts, failedPay24h, payoutFailed, pendingHostApps, fraudListings] =
    await Promise.all([
      prisma.user.count({
        where: { accountStatus: "RESTRICTED" },
      }),
      prisma.booking.groupBy({
        by: ["listingId"],
        where: {
          status: { in: [BookingStatus.CANCELLED_BY_GUEST, BookingStatus.CANCELLED_BY_HOST] },
          createdAt: { gte: new Date(Date.now() - 90 * 86400000) },
        },
        _count: { _all: true },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.FAILED,
          updatedAt: { gte: new Date(Date.now() - 86400000) },
        },
      }),
      prisma.bnhubHostPayoutRecord.count({ where: { payoutStatus: "FAILED" } }),
      prisma.bnhubHost.count({ where: { status: "pending" } }),
      prisma.shortTermListing.count({
        where: { listingStatus: ListingStatus.UNDER_INVESTIGATION },
      }),
    ]);

  if (suspiciousUsers > 0) {
    alerts.push({
      id: "restricted-users",
      severity: "medium",
      title: "Restricted accounts",
      detail: `${suspiciousUsers} user(s) in RESTRICTED state`,
      href: "/admin/users",
    });
  }

  const repeatCancel = highCancelHosts.filter((g) => g._count._all >= 3).length;
  if (repeatCancel > 0) {
    alerts.push({
      id: "cancel-clusters",
      severity: "high",
      title: "Repeated cancellations",
      detail: `${repeatCancel} listing(s) with 3+ cancellations (90d)`,
      href: "/admin/bookings",
    });
  }

  if (failedPay24h > 5) {
    alerts.push({
      id: "failed-payments",
      severity: "high",
      title: "Failed payment spike",
      detail: `${failedPay24h} failed payments in 24h`,
      href: "/admin/bookings",
    });
  }

  if (payoutFailed > 0) {
    alerts.push({
      id: "payout-failed",
      severity: "high",
      title: "Failed host payouts",
      detail: `${payoutFailed} payout record(s) in FAILED`,
      href: "/admin/payouts",
    });
  }

  if (pendingHostApps > 0) {
    alerts.push({
      id: "host-kyc",
      severity: "low",
      title: "Host applications pending",
      detail: `${pendingHostApps} host application(s) awaiting review`,
      href: "/admin/hosts",
    });
  }

  if (fraudListings > 0) {
    alerts.push({
      id: "listing-fraud",
      severity: "high",
      title: "Listings under fraud review",
      detail: `${fraudListings} listing(s) in UNDER_INVESTIGATION`,
      href: "/admin/listings?flagged=1",
    });
  }

  alerts.push({
    id: "chargeback-placeholder",
    severity: "low",
    title: "Chargeback monitoring",
    detail: "Connect Stripe Radar / dispute webhooks for live chargeback risk.",
    href: "/admin/monitoring",
  });

  return alerts;
}
