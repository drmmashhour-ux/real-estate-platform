/**
 * Revenue acceleration loop: repeat purchase hints, subscription nudges, real-only urgency.
 * No fake scarcity; pricing copy references catalog + Stripe.
 */
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { logInfo } from "@/lib/logger";
import { getPricing } from "./pricing.config";

const LEAD_PURCHASE_TYPES = ["lead_purchased", "lead_unlock"] as const;

export type SimilarLeadRow = {
  id: string;
  listingId: string;
  region: string | null;
  priceCad: string;
  score: number;
  href: string;
  createdAt: string;
};

export type UrgencySignals = {
  /** Distinct brokers with CRM activity on this lead in the window (real; not "views"). */
  engagedBrokersInWindow: number;
  windowHours: number;
  showEngagedBrokers: boolean;
  isRecentlyAdded: boolean;
  leadCreatedAt: string;
  /** Optional: peer lead flow in same region (30d), from lead API semantics */
  regionPeerLeadCount: number | null;
};

export type RevenueLoopForLead = {
  similarLeads: SimilarLeadRow[];
  urgency: UrgencySignals;
  showPremiumTeaser: boolean;
  showBulkBundleHint: boolean;
  /** Progress toward 3-purchase bundle (0–2 in current rolling window) */
  bundleProgress: { current: number; target: 3; discountPercent: number; windowDays: number };
  purchaseCount90d: number;
  /** Display price for transparency (catalog; Stripe is source of truth at checkout) */
  premiumMonthlyCad: number;
  premiumBenefits: string[];
  disclaimer: string;
};

const BUNDLE_MIN = 3;
const BUNDLE_DISCOUNT_PCT = 10;
const BUNDLE_WINDOW_DAYS = 30;
const RECENT_DAYS = 7;
const ENGAGE_WINDOW_H = 48;
const MIN_BROKERS_TO_SHOW_ENGAGEMENT = 2;

function leadDetailPath(leadId: string) {
  return `/dashboard/leads/${encodeURIComponent(leadId)}`;
}

/**
 * Find marketplace leads similar by region (and optionally same leadType) — excludes current lead.
 */
export async function findSimilarMarketplaceLeads(leadId: string, take = 3): Promise<SimilarLeadRow[]> {
  try {
    const ref = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { purchaseRegion: true, leadType: true },
    });
    if (!ref) return [];
    const region = ref.purchaseRegion?.trim() || null;
    const baseWhere = { status: "available" as const, leadId: { not: leadId } };
    const rows = await prisma.leadMarketplaceListing.findMany({
      where: region ? { ...baseWhere, lead: { purchaseRegion: region } } : baseWhere,
      take: 12,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      include: { lead: { select: { id: true, purchaseRegion: true, leadType: true, createdAt: true } } },
    });
    const out: SimilarLeadRow[] = [];
    for (const r of rows) {
      if (out.length >= take) break;
      if (ref.leadType && r.lead.leadType && r.lead.leadType !== ref.leadType) {
        continue;
      }
      out.push({
        id: r.leadId,
        listingId: r.id,
        region: r.lead.purchaseRegion,
        priceCad: (r.priceCents / 100).toFixed(0),
        score: r.score,
        href: leadDetailPath(r.leadId),
        createdAt: r.lead.createdAt.toISOString(),
      });
    }
    if (out.length < take) {
      const extra = await prisma.leadMarketplaceListing.findMany({
        where: baseWhere,
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { lead: { select: { id: true, purchaseRegion: true, createdAt: true } } },
      });
      for (const r of extra) {
        if (out.some((x) => x.id === r.leadId)) continue;
        if (out.length >= take) break;
        out.push({
          id: r.leadId,
          listingId: r.id,
          region: r.lead.purchaseRegion,
          priceCad: (r.priceCents / 100).toFixed(0),
          score: r.score,
          href: leadDetailPath(r.leadId),
          createdAt: r.lead.createdAt.toISOString(),
        });
      }
    }
    return out.slice(0, take);
  } catch (e) {
    logInfo("[revenue-loop] similar_leads failed", { err: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

/**
 * Real engagement: distinct brokers with CRM notes on this lead in last `hours`.
 */
export async function getEngagedBrokersOnLead(leadId: string, hours = ENGAGE_WINDOW_H): Promise<number> {
  try {
    const since = new Date(Date.now() - hours * 3600 * 1000);
    const g = await prisma.crmInteraction.groupBy({
      by: ["brokerId"],
      where: { leadId, createdAt: { gte: since } },
    });
    return g.length;
  } catch {
    return 0;
  }
}

function daysSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

export async function getUrgencyForLead(leadId: string, regionPeerLeadCount: number | null): Promise<UrgencySignals> {
  const lead = await prisma.lead
    .findUnique({
      where: { id: leadId },
      select: { createdAt: true },
    })
    .catch(() => null);
  const engaged = await getEngagedBrokersOnLead(leadId, ENGAGE_WINDOW_H);
  const createdAt = lead?.createdAt.toISOString() ?? new Date().toISOString();
  return {
    engagedBrokersInWindow: engaged,
    windowHours: ENGAGE_WINDOW_H,
    showEngagedBrokers: engaged >= MIN_BROKERS_TO_SHOW_ENGAGEMENT,
    isRecentlyAdded: daysSince(createdAt) <= RECENT_DAYS,
    leadCreatedAt: createdAt,
    regionPeerLeadCount,
  };
}

export async function countBrokerLeadPurchases(brokerId: string, days = 90): Promise<number> {
  try {
    const since = new Date(Date.now() - days * 86400000);
    const c = await prisma.revenueEvent.count({
      where: {
        userId: brokerId,
        createdAt: { gte: since },
        eventType: { in: [...LEAD_PURCHASE_TYPES] },
      },
    });
    return c;
  } catch {
    return 0;
  }
}

/**
 * Rolling window count toward bundle: purchases in last BUNDLE_WINDOW_DAYS.
 */
export async function countBrokerLeadPurchasesInWindow(brokerId: string, days = BUNDLE_WINDOW_DAYS): Promise<number> {
  return countBrokerLeadPurchases(brokerId, days);
}

export function bundleProgressForCount(countInWindow: number) {
  const inCycle = countInWindow % BUNDLE_MIN;
  return {
    current: inCycle,
    target: BUNDLE_MIN,
    discountPercent: BUNDLE_DISCOUNT_PCT,
    windowDays: BUNDLE_WINDOW_DAYS,
  };
}

/**
 * Assemble response for a broker viewing a lead (for API).
 */
export async function getRevenueLoopForLead(
  leadId: string,
  brokerId: string,
  options?: { regionPeerLeadCount?: number | null }
): Promise<RevenueLoopForLead> {
  const p = getPricing();
  let regionPeer = options?.regionPeerLeadCount ?? null;
  if (regionPeer == null) {
    try {
      const L = await prisma.lead.findUnique({ where: { id: leadId }, select: { purchaseRegion: true } });
      const r = L?.purchaseRegion?.trim();
      if (r) {
        const since = new Date(Date.now() - 30 * 86400000);
        regionPeer = await prisma.lead.count({
          where: { purchaseRegion: r, createdAt: { gte: since }, NOT: { id: leadId } },
        });
      }
    } catch {
      regionPeer = null;
    }
  }
  const [similar, nPurchases, urgencyBase] = await Promise.all([
    findSimilarMarketplaceLeads(leadId, 3),
    countBrokerLeadPurchasesInWindow(brokerId, BUNDLE_WINDOW_DAYS),
    getUrgencyForLead(leadId, regionPeer),
  ]);
  const showPremiumTeaser = nPurchases >= 1 && nPurchases <= 2;
  const showBulkBundleHint = nPurchases >= 1;
  const disc =
    "Prices for marketplace leads and subscriptions are set in-product and in Stripe; totals may differ by tax and promotions applied at payment.";
  return {
    similarLeads: similar,
    urgency: urgencyBase,
    showPremiumTeaser,
    showBulkBundleHint,
    bundleProgress: bundleProgressForCount(nPurchases),
    purchaseCount90d: await countBrokerLeadPurchases(brokerId, 90),
    premiumMonthlyCad: p.premiumSubscriptionMonthly,
    premiumBenefits: [
      "Priority in lead routing (when your plan and routing policy allow).",
      "Advanced AI and CRM insight panels (per feature flags and plan).",
      "Early access to selected marketplace and automation features (rolled out to plan tiers).",
    ],
    disclaimer: disc,
  };
}

export async function noteRevenueLoopAfterPurchase(brokerId: string, leadId: string) {
  try {
    void brokerId;
    logInfo("[revenue-loop] post_purchase", { leadId, hint: "repeat_and_bundle_surfaces" });
  } catch {
    /* */
  }
}

export type BrokerLtvPanel = {
  repeatPurchaseRate: number | null;
  /** Among brokers with at least one purchase */
  avgRevenuePerActiveBroker: number | null;
  topSpenders: { userId: string; name: string | null; email: string | null; totalCad: number; purchaseCount: number }[];
  windowDays: number;
  note: string;
};

/**
 * Admin: cohort stats from `revenue_events` (internal ledger; reconcile with Stripe for external reporting).
 */
export async function getBrokerLtvPanelStats(windowDays = 90): Promise<BrokerLtvPanel> {
  const since = new Date(Date.now() - windowDays * 86400000);
  const note =
    "Derived from internal revenue_events (lead_purchased / lead_unlock). Reconcile with Stripe and broker billing for board-level revenue.";
  try {
    const ev = await prisma.revenueEvent.findMany({
      where: {
        userId: { not: null },
        createdAt: { gte: since },
        eventType: { in: [...LEAD_PURCHASE_TYPES] },
      },
      select: { userId: true, amount: true },
    });
    const byUser = new Map<string, { total: number; n: number }>();
    for (const e of ev) {
      if (!e.userId) continue;
      const z = byUser.get(e.userId) ?? { total: 0, n: 0 };
      z.total += e.amount;
      z.n += 1;
      byUser.set(e.userId, z);
    }
    if (byUser.size === 0) {
      return { repeatPurchaseRate: null, avgRevenuePerActiveBroker: null, topSpenders: [], windowDays, note };
    }
    const repeat = [...byUser.values()].filter((x) => x.n > 1).length;
    const repeatPurchaseRate = repeat / byUser.size;
    const avgRevenuePerActiveBroker =
      [...byUser.values()].reduce((s, x) => s + x.total, 0) / byUser.size;
    const topIds = [...byUser.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([uid]) => uid);
    const users = await prisma.user.findMany({
      where: { id: { in: topIds } },
      select: { id: true, name: true, email: true },
    });
    const umap = new Map(users.map((u) => [u.id, u]));
    const topSpenders = topIds.map((id) => {
      const a = byUser.get(id)!;
      const u = umap.get(id);
      return {
        userId: id,
        name: u?.name ?? null,
        email: u?.email ?? null,
        totalCad: Math.round(a.total * 100) / 100,
        purchaseCount: a.n,
      };
    });
    return { repeatPurchaseRate, avgRevenuePerActiveBroker, topSpenders, windowDays, note };
  } catch (e) {
    logInfo("[revenue-loop] ltv panel failed", { err: e instanceof Error ? e.message : String(e) });
    return { repeatPurchaseRate: null, avgRevenuePerActiveBroker: null, topSpenders: [], windowDays, note: note + " (partial)" };
  }
}
