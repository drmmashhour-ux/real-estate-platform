import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOrchestratedPaymentDelegate } from "@/lib/admin/prisma-orchestration-delegates";
import type { KPICardItem } from "@/components/admin/KPICards";
import type { PaymentsTableRow } from "@/components/admin/PaymentsTable";

function mapPlatformStatus(s: string): PaymentsTableRow["status"] {
  if (s === "paid") return "paid";
  if (s === "failed") return "failed";
  return "pending";
}

function mapOrchestratedStatus(s: string): PaymentsTableRow["status"] {
  if (s === "succeeded") return "paid";
  if (s === "failed" || s === "refunded") return "failed";
  return "pending";
}

function userLabel(email: string | null | undefined, name: string | null | undefined, id: string): string {
  const e = email?.trim();
  if (e) return e.split("@")[0] ?? e;
  const n = name?.trim();
  if (n) return n;
  return `${id.slice(0, 8)}…`;
}

export type CommandCenterData = {
  kpiItems: KPICardItem[];
  paymentRows: PaymentsTableRow[];
  conversionRateLabel: string;
};

/**
 * Live aggregates + last 5 payment-like rows for `/admin` command center (no demo literals).
 */
export async function getAdminCommandCenterData(): Promise<CommandCenterData> {
  // eslint-disable-next-line react-hooks/purity -- intentional rolling window
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orch = getOrchestratedPaymentDelegate();

  const [
    paidPlatformSum,
    brokerPaymentSuccessSum,
    orchestratedSucceededSum30d,
    bookingsCount30d,
    publishedListingsCount,
    checkoutStarts,
    checkoutSuccesses,
    platformRecent,
    orchestratedRecent,
    bnhubRecent,
  ] = await Promise.all([
    prisma.platformPayment
      .aggregate({
        where: { status: "paid", createdAt: { gte: since } },
        _sum: { amountCents: true },
      })
      .catch(() => ({ _sum: { amountCents: null as number | null } })),
    prisma.brokerPayment
      .aggregate({
        where: { status: "success", createdAt: { gte: since } },
        _sum: { amount: true },
      })
      .catch(() => ({ _sum: { amount: null as number | null } })),
    orch
      ? orch
          .aggregate({
            where: { status: "succeeded", createdAt: { gte: since } },
            _sum: { amountCents: true },
          })
          .catch(() => ({ _sum: { amountCents: null as number | null } }))
      : Promise.resolve({ _sum: { amountCents: null as number | null } }),
    prisma.booking.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.shortTermListing.count({ where: { listingStatus: "PUBLISHED" } }).catch(() => 0),
    prisma.launchEvent.count({ where: { event: "CHECKOUT_START", createdAt: { gte: since } } }).catch(() => 0),
    prisma.launchEvent.count({ where: { event: "CHECKOUT_SUCCESS", createdAt: { gte: since } } }).catch(() => 0),
    prisma.platformPayment
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          amountCents: true,
          status: true,
          createdAt: true,
          paymentType: true,
          user: { select: { id: true, email: true, name: true } },
        },
      })
      .catch(() => []),
    orch
      ? orch
          .findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
              id: true,
              amountCents: true,
              status: true,
              createdAt: true,
              provider: true,
              user: { select: { id: true, email: true, name: true } },
            },
          })
          .catch(() => [])
      : Promise.resolve([]),
    prisma.payment
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          amountCents: true,
          status: true,
          createdAt: true,
          booking: {
            select: {
              id: true,
              guest: { select: { email: true, name: true, id: true } },
            },
          },
        },
      })
      .catch(() => []),
  ]);

  const revenue30dCad =
    (paidPlatformSum._sum.amountCents ?? 0) / 100 +
    (brokerPaymentSuccessSum._sum.amount ?? 0) +
    (orchestratedSucceededSum30d._sum.amountCents ?? 0) / 100;

  const conversionRateLabel =
    checkoutStarts > 0 ? `${((checkoutSuccesses / checkoutStarts) * 100).toFixed(1)}%` : "—";

  const kpiItems: KPICardItem[] = [
    { label: "Revenue (30D)", value: `$${revenue30dCad.toFixed(2)} CAD` },
    { label: "Bookings (30D)", value: String(bookingsCount30d), href: "/admin/bookings" },
    { label: "Conversion (sample)", value: conversionRateLabel },
    {
      label: "Published listings",
      value: String(publishedListingsCount),
      href: "/admin/listings",
    },
  ];

  type Merged = { t: number; row: PaymentsTableRow };
  const merged: Merged[] = [];

  const monetizationHref = "/admin/monetization";
  const bnhubRefundsHref = "/admin/bnhub/finance/refunds";

  for (const p of platformRecent) {
    merged.push({
      t: p.createdAt.getTime(),
      row: {
        id: `pp_${p.id}`,
        user: userLabel(p.user.email, p.user.name, p.user.id),
        amount: `${(p.amountCents / 100).toFixed(2)} CAD`,
        status: mapPlatformStatus(p.status),
        viewHref: monetizationHref,
        refundHref: bnhubRefundsHref,
      },
    });
  }
  for (const o of orchestratedRecent) {
    merged.push({
      t: o.createdAt.getTime(),
      row: {
        id: `op_${o.id}`,
        user: `${userLabel(o.user.email, o.user.name, o.user.id)} (${o.provider})`,
        amount: `${(o.amountCents / 100).toFixed(2)} CAD`,
        status: mapOrchestratedStatus(o.status),
        viewHref: monetizationHref,
        refundHref: bnhubRefundsHref,
      },
    });
  }
  for (const b of bnhubRecent) {
    const g = b.booking?.guest;
    const guestId = g?.id ?? "unknown";
    const bookingId = b.booking?.id;
    let st: PaymentsTableRow["status"] = "pending";
    if (b.status === PaymentStatus.COMPLETED || b.status === PaymentStatus.PARTIALLY_REFUNDED) st = "paid";
    else if (b.status === PaymentStatus.REFUNDED || b.status === PaymentStatus.FAILED) st = "failed";
    merged.push({
      t: b.createdAt.getTime(),
      row: {
        id: `bnh_${b.id}`,
        user: userLabel(g?.email, g?.name, guestId),
        amount: `${(b.amountCents / 100).toFixed(2)} CAD`,
        status: st,
        viewHref: bookingId ? `/bnhub/booking/${bookingId}` : "/admin/bookings",
        refundHref: bnhubRefundsHref,
      },
    });
  }

  merged.sort((a, b) => b.t - a.t);
  const paymentRows = merged.slice(0, 5).map((m) => m.row);

  return { kpiItems, paymentRows, conversionRateLabel };
}
