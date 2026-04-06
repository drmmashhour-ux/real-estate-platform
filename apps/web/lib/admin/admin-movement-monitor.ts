import { getPlatformEvents } from "@/lib/observability";
import { prisma } from "@/lib/db";

type PlatformEventRow = Awaited<ReturnType<typeof getPlatformEvents>>[number];

function countBy<T>(rows: T[], fn: (row: T) => boolean): number {
  return rows.reduce((count, row) => count + (fn(row) ? 1 : 0), 0);
}

function formatMovementLabel(event: PlatformEventRow): string {
  switch (event.eventType) {
    case "listing_activated":
      return "Listing activated";
    case "contract_signed":
      return "Contract signed";
    case "payment_completed":
      return "Payment completed";
    case "payment_failed":
      return "Payment failed";
    default:
      return event.eventType.replace(/_/g, " ");
  }
}

export async function getAdminMovementMonitor() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [events, dealLegalEvents, immoEnforcementLogs, financeRows, pendingPlatformPayments, pendingBrokerCommissions] = await Promise.all([
    getPlatformEvents({ since, limit: 150 }),
    prisma.leadContactAuditEvent.findMany({
      where: {
        createdAt: { gte: since },
        eventType: { startsWith: "deal_legal_" },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        eventType: true,
        listingId: true,
        leadId: true,
        createdAt: true,
      },
    }),
    prisma.immoContactLog.findMany({
      where: {
        createdAt: { gte: since },
        metadata: {
          path: ["eventType"],
          equals: "ADMIN_ENFORCEMENT",
        },
      },
      orderBy: { actionAt: "desc" },
      take: 20,
      select: {
        id: true,
        listingId: true,
        userId: true,
        brokerId: true,
        actionAt: true,
        metadata: true,
      },
    }),
    prisma.platformCommissionRecord.findMany({
      where: {
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        commissionSource: true,
        commissionEligible: true,
        commissionAmountCents: true,
        dealId: true,
        createdAt: true,
      },
    }),
    prisma.platformPayment.aggregate({
      where: { status: "pending" },
      _sum: { amountCents: true },
    }),
    prisma.brokerCommission.aggregate({
      where: { status: "pending" },
      _sum: { brokerAmountCents: true },
    }),
  ]);

  const listingMoves = countBy(events, (event) => event.entityType === "FSBO_LISTING");
  const contractMoves = countBy(events, (event) => event.entityType === "CONTRACT");
  const paymentMoves = countBy(
    events,
    (event) => /payment/i.test(event.entityType ?? "") || /payment/i.test(event.eventType ?? "")
  );
  const trustMoves = countBy(
    events,
    (event) =>
      /trust|verification|document/i.test(event.sourceModule ?? "") ||
      /trust|verification|document/i.test(event.eventType ?? "")
  );
  const dealMoves = dealLegalEvents.length;
  const enforcementMoves = immoEnforcementLogs.length;
  const financeRiskMoves =
    countBy(events, (event) => event.eventType === "payment_failed" || event.eventType === "commission_generated") +
    financeRows.length;
  const collectibleMoneyCents =
    (pendingPlatformPayments._sum.amountCents ?? 0) + (pendingBrokerCommissions._sum.brokerAmountCents ?? 0);
  const collectibleMoneyLabel = `${(collectibleMoneyCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  })}`;

  const aiSummary: string[] = [];
  aiSummary.push(
    listingMoves > 0
      ? `Listings are moving: ${listingMoves} FSBO listing events were recorded in the last 24 hours.`
      : "Listings are quiet right now; no FSBO listing platform events were captured in the last 24 hours."
  );
  aiSummary.push(
    contractMoves > 0
      ? `${contractMoves} contract events were logged, which helps admin track authority, seller agreements, and signed movement.`
      : "No contract movement was captured in the last 24 hours."
  );
  aiSummary.push(
    paymentMoves > 0
      ? `${paymentMoves} payment-related events were captured, so finance and activation movement are active.`
      : "No payment movement was captured in the last 24 hours."
  );
  aiSummary.push(
    trustMoves > 0
      ? `${trustMoves} trust/compliance events were detected, indicating active verification or document review work.`
      : "Trust and compliance movement appears quiet based on recent platform events."
  );
  aiSummary.push(
    dealMoves > 0
      ? `${dealMoves} deal-legal movements were detected, including offer and closing-stage audit events.`
      : "No new deal-legal stage movement was captured in the last 24 hours."
  );
  aiSummary.push(
    enforcementMoves > 0
      ? `${enforcementMoves} monitored-contact enforcement movements were logged for admin review.`
      : "No admin contact-enforcement movement was captured in the last 24 hours."
  );
  aiSummary.push(
    collectibleMoneyCents > 0
      ? `${collectibleMoneyLabel} is currently sitting in pending platform payments or unpaid broker commissions that should be reviewed for collection or release.`
      : "No meaningful pending collection balance was detected across platform payments and broker commissions."
  );

  const priorityFeed = events.slice(0, 8).map((event) => {
    let href: string | undefined;
    let linkLabel: string | undefined;

    if (event.entityType === "FSBO_LISTING") {
      href = event.entityId ? `/admin/fsbo/${event.entityId}` : "/admin/fsbo";
      linkLabel = "Open listing";
    } else if (event.entityType === "CONTRACT") {
      href = event.entityId ? `/contracts/${event.entityId}` : "/contracts";
      linkLabel = "Open contract";
    } else if (/payment/i.test(event.entityType ?? "") || /payment/i.test(event.eventType ?? "")) {
      href = "/admin/finance";
      linkLabel = "Open finance";
    }

    return {
      title: formatMovementLabel(event),
      detail: `${event.entityType} · ${event.sourceModule ?? "unknown"} · ${event.entityId}`,
      at: event.createdAt.toLocaleString(),
      href,
      linkLabel,
    };
  });

  return {
    last24h: [
      {
        title: "Listing movements",
        value: listingMoves,
        hint: "Activation, publish, and listing-related tracked events in the last 24 hours.",
      },
      {
        title: "Contract movements",
        value: contractMoves,
        hint: "Signed or updated agreement flow detected through platform events.",
      },
      {
        title: "Payment movements",
        value: paymentMoves,
        hint: "Checkout, webhook, or payment-status events captured recently.",
      },
      {
        title: "Trust movements",
        value: trustMoves,
        hint: "Verification, compliance, and document-related event activity.",
      },
      {
        title: "Money to collect",
        value: Math.round(collectibleMoneyCents / 100),
        hint: `${collectibleMoneyLabel} pending across platform payments and broker commissions.`,
      },
    ],
    priorityFeed,
    aiSummary,
    lanes: [
      {
        title: "FSBO legal & compliance",
        summary: `${trustMoves} compliance-related platform events in the last 24 hours.`,
        actionHref: "/admin/fsbo",
        actionLabel: "Open FSBO control",
        items: events
          .filter((event) => /trust|verification|document|listing_activated/i.test(`${event.sourceModule ?? ""} ${event.eventType}`))
          .slice(0, 6)
          .map((event) => ({
            title: formatMovementLabel(event),
            detail: `${event.entityType} · ${event.sourceModule ?? "unknown"} · ${event.entityId}`,
            at: event.createdAt.toLocaleString(),
            href: event.entityType === "FSBO_LISTING" ? `/admin/fsbo/${event.entityId}` : "/admin/fsbo",
            linkLabel: event.entityType === "FSBO_LISTING" ? "Open listing" : "Open FSBO control",
          })),
      },
      {
        title: "Deal legal timeline",
        summary: `${dealMoves} legal stage events recorded across active deals in the last 24 hours.`,
        actionHref: "/admin/deals",
        actionLabel: "Open deals hub",
        items: dealLegalEvents.slice(0, 6).map((event) => ({
          title: event.eventType.replace(/_/g, " "),
          detail: `Lead ${event.leadId} · Listing ${event.listingId ?? "n/a"}`,
          at: event.createdAt.toLocaleString(),
          href: event.listingId ? `/admin/fsbo/${event.listingId}` : "/admin/deals",
          linkLabel: event.listingId ? "Open listing legal" : "Open deals hub",
        })),
      },
      {
        title: "Contact enforcement",
        summary: `${enforcementMoves} admin enforcement actions or contact restrictions were logged recently.`,
        actionHref: "/admin/immo-contact",
        actionLabel: "Open ImmoContact control",
        items: immoEnforcementLogs.slice(0, 6).map((log) => {
          const meta =
            log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
              ? (log.metadata as Record<string, unknown>)
              : {};
          return {
            title: String(meta.actionType ?? "ADMIN_ENFORCEMENT").replace(/_/g, " "),
            detail: `Listing ${log.listingId ?? "n/a"} · Buyer ${log.userId ?? "n/a"} · Broker ${log.brokerId ?? "n/a"}`,
            at: log.actionAt.toLocaleString(),
            href: log.listingId ? `/admin/fsbo/${log.listingId}` : "/admin/immo-contact",
            linkLabel: log.listingId ? "Open listing review" : "Open ImmoContact control",
          };
        }),
      },
      {
        title: "Payment & commission risk",
        summary: `${financeRiskMoves} payment or commission movements were captured for finance oversight.`,
        actionHref: "/admin/finance",
        actionLabel: "Open finance control",
        items: [
          ...events
            .filter((event) => event.eventType === "payment_failed" || event.eventType === "commission_generated")
            .slice(0, 3)
            .map((event) => ({
              title: formatMovementLabel(event),
              detail: `${event.entityType} · ${event.entityId}`,
              at: event.createdAt.toLocaleString(),
              href: "/admin/finance",
              linkLabel: "Open finance",
            })),
          ...financeRows.slice(0, 3).map((row) => ({
            title: row.commissionEligible ? "Commission eligible record" : "Commission review record",
            detail: `${row.commissionSource ?? "unknown"} · ${(row.commissionAmountCents ?? 0) / 100} CAD · Deal ${row.dealId ?? "n/a"}`,
            at: row.createdAt.toLocaleString(),
            href: row.dealId ? `/dashboard/deals/${row.dealId}` : "/admin/finance",
            linkLabel: row.dealId ? "Open deal" : "Open finance",
          })),
        ].slice(0, 6),
      },
    ],
  };
}
