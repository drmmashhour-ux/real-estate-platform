import { prisma } from "@/lib/db";
import {
  aggregateSnapshotInputs,
  getMarketplaceMetrics,
  utcDayStart,
} from "@/src/modules/investor-metrics/metricsEngine";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_NAME,
} from "@/lib/brand/platform";
import type { PitchDeckContext, PitchSection, PitchVariant } from "./pitch.types";

export type { PitchDeckContext } from "./pitch.types";

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

/** Leads created in 30d — same window as marketplace metrics. */
async function leads30dCount(asOf: Date): Promise<number> {
  const end = utcDayStart(asOf);
  const since30 = new Date(end);
  since30.setUTCDate(since30.getUTCDate() - 30);
  return prisma.lead.count({
    where: { createdAt: { gte: since30, lte: asOf } },
  });
}

export async function loadPitchDeckContextFull(asOf = new Date()): Promise<PitchDeckContext> {
  const [snap, m, leads] = await Promise.all([
    aggregateSnapshotInputs(asOf),
    getMarketplaceMetrics(asOf),
    leads30dCount(asOf),
  ]);
  return {
    totalUsers: snap.totalUsers,
    activeUsers30d: snap.activeUsers,
    totalListings: snap.totalListings,
    bookings30d: snap.bookings,
    revenue30d: snap.revenue,
    conversionRate: snap.conversionRate,
    leads30d: leads,
    buyerPersonaUsers: m.buyerPersonaUsers,
    buyersToListingsRatio: m.buyersToListingsRatio,
  };
}

function sectionsForVariant(
  ctx: PitchDeckContext,
  variant: PitchVariant,
): PitchSection[] {
  const rev = ctx.revenue30d;
  const revLabel = rev >= 1000 ? `€${fmtMoney(rev)}` : `€${rev.toFixed(0)}`;
  const convPct = (ctx.conversionRate * 100).toFixed(1);
  const ratio = ctx.buyersToListingsRatio.toFixed(2);

  const short = variant === "short";
  const long = variant === "long";

  const problem: PitchSection = {
    id: "problem",
    title: "Problem",
    content: short
      ? `Real estate investing and transactions stay fragmented: data, short-term stays, FSBO, and broker workflows rarely sit on one trusted layer. ${PLATFORM_NAME} addresses that gap for operators and end users.`
      : `Property investors and marketplaces juggle disconnected tools — listings, bookings, lead flow, and financial insight rarely share one operational backbone. ${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}) unifies discovery, trust, and monetization so teams can scale without rebuilding the stack each time.${
          long
            ? " Founders need a credible, EU-aligned platform narrative for buyers, hosts, brokers, and capital partners in one place."
            : ""
        }`,
    bullets: short
      ? ["Fragmented journeys across search, stays, and resale", "Weak cross-surface analytics for fundraising narrative"]
      : [
          "Siloed listing, booking, and CRM data across stakeholders",
          "Hard to show traction and unit economics to investors in one view",
          long ? "Regulatory and trust signals (verification, moderation) must be first-class, not bolted on" : "",
        ].filter(Boolean),
  };

  const solution: PitchSection = {
    id: "solution",
    title: "Solution",
    content: `${PLATFORM_NAME} is an AI-augmented real estate platform: marketplace surfaces (Immobilier Hub, BNHUB stays, FSBO, broker tooling) with admin-grade metrics, investor views, and revenue events — so the business story matches the product.`,
    bullets: short
      ? ["Single brand, multiple hubs", "Investor-ready metrics baked into admin"]
      : [
          "Role-aware workspaces for buyers, sellers, hosts, brokers, and admins",
          "Operational telemetry (users, listings, bookings, revenue) for pitch and diligence",
          long ? "Extensible billing hooks (subscriptions, unlocks, marketplace fees) without rewriting core flows" : "",
        ].filter(Boolean),
  };

  const product: PitchSection = {
    id: "product",
    title: "Product",
    content: long
      ? `The product spans public marketing and SEO surfaces, authenticated dashboards (broker, seller, host, buyer, tenant), BNHUB short-term listings with bookings and payouts, FSBO listing flows with moderation, lead CRM, referrals, and admin consoles for finance, growth, and trust & safety. ${PLATFORM_NAME} is built to present a coherent investor arc: acquisition → activation → marketplace depth.`
      : `Dashboards for brokers, sellers, hosts, and buyers; BNHUB for stays; FSBO and listings; CRM-style leads; admin for finance, growth, and operations — all under one ${PLATFORM_NAME} identity.`,
    bullets: [
      "Listings, bookings, and lead pipeline in one ecosystem",
      "Admin investor hub: pitch, metrics, financials, Q&A",
      short ? "" : "AI-assisted workflows where the codebase already supports them (assistant, pricing, inbox)",
    ].filter(Boolean),
  };

  const businessModel: PitchSection = {
    id: "business_model",
    title: "Business model",
    content: `Revenue mixes marketplace and SaaS-style streams: take rates on bookings and transactions where applicable, premium unlocks and subscriptions for power users and brokers, and platform fees documented in billing settings. ${rev > 0 ? `Trailing 30-day recognized revenue is ${revLabel} (from platform revenue events).` : "Revenue lines are wired; scale comes from volume and attach on existing flows."}`,
    bullets: [
      "Marketplace: bookings, boosts, lead unlocks",
      "Recurring: workspace / premium tiers where enabled",
      long ? "Transparent RevenueEvent trail for investor reporting" : "",
    ].filter(Boolean),
  };

  const traction: PitchSection = {
    id: "traction",
    title: "Traction",
    content: `Live snapshot: ${ctx.totalUsers.toLocaleString()} registered users; ${ctx.activeUsers30d.toLocaleString()} active in the last 30 days; ${ctx.totalListings} supply-side listings (BNHUB + FSBO); ${ctx.bookings30d} confirmed/completed bookings in 30d; ${ctx.leads30d} leads created in 30d; ${rev > 0 ? `${revLabel} revenue (30d).` : "Revenue events ready to reflect monetization as volume grows."} Win rate (won / closed opportunities in window) is about ${convPct}%.`,
    bullets: [
      `Users: ${ctx.totalUsers.toLocaleString()} total · ${ctx.activeUsers30d.toLocaleString()} active (30d)`,
      `Supply: ${ctx.totalListings} listings · Demand signals: ${ctx.leads30d} leads (30d)`,
      `Bookings (30d): ${ctx.bookings30d}`,
    ],
  };

  const market: PitchSection = {
    id: "market",
    title: "Market",
    content: long
      ? `European real estate and short-term rental markets remain large but localized. ${PLATFORM_NAME} positions for cross-border discovery with a trust and compliance posture suitable for institutional partners — starting from operational density (listings + bookings + leads) before geographic blitz.`
      : `Large TAM across residential investment, short-term stays, and brokerage services; ${PLATFORM_NAME} wins by depth of workflow and data, not a single landing page.`,
    bullets: [
      `Buyer-side reach indicator: ~${ctx.buyerPersonaUsers.toLocaleString()} buyer-persona active users`,
      `Liquidity proxy (buyers ÷ listings): ${ratio}`,
      short ? "" : "Expansion: more cities and partner brokers on the same core",
    ].filter(Boolean),
  };

  const advantage: PitchSection = {
    id: "advantage",
    title: "Advantage",
    content: `Differentiation is full-stack presence: not only SEO and listings but authenticated marketplaces, Stripe-connected payouts, admin investor surfaces, and structured metrics — hard to replicate with a thin front-end on third-party tools.`,
    bullets: [
      "Unified brand: LECIPM + Carrefour Prestige narrative",
      "Investor-grade exports and hub metrics out of the box",
      long ? "Moderation, verification, and CRM depth reduce leakage vs. point solutions" : "",
    ].filter(Boolean),
  };

  const vision: PitchSection = {
    id: "vision",
    title: "Vision",
    content: long
      ? `Become the default operating system for European luxury and investment-grade property: where hosts, sellers, brokers, and capital partners coordinate — with AI improving routing, pricing, and compliance over time.`
      : `The default European platform where property meets capital: transparent, measurable, and founder-ready at every board meeting.`,
    bullets: [
      "Deepen marketplace liquidity and broker network effects",
      "Layer financial products and institutional partnerships",
    ],
  };

  const ask: PitchSection = {
    id: "ask",
    title: "The ask",
    content: long
      ? `We are raising to accelerate geographic expansion, broker partnerships, and product depth (trust, payments, AI workflows) while maintaining capital efficiency. We invite investors who value regulated marketplaces, measurable unit economics, and a team that ships full-stack product.`
      : `Raising to scale acquisition, deepen the marketplace, and extend financial & AI capabilities — partners who understand regulated marketplaces and long-term retention.`,
    bullets: [
      "Use of funds: growth, product, compliance, key hires",
      "Milestones: listing & booking growth, revenue mix, NPS with brokers",
    ],
  };

  return [problem, solution, product, businessModel, traction, market, advantage, vision, ask];
}

/** Builds pitch sections from an already-loaded context (no extra DB round trip). */
export function buildPitchDeckFromContext(
  ctx: PitchDeckContext,
  variant: PitchVariant = "standard",
): PitchSection[] {
  return sectionsForVariant(ctx, variant);
}

/**
 * Builds the canonical LECIPM investor pitch sections (problem → ask).
 * Uses live platform metrics (30d windows) where available.
 */
export async function buildPitchDeck(variant: PitchVariant = "standard"): Promise<PitchSection[]> {
  const ctx = await loadPitchDeckContextFull();
  return sectionsForVariant(ctx, variant);
}

