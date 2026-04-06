import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { aggregateSnapshotInputs, utcDayStart } from "@/src/modules/investor-metrics/metricsEngine";
import { getRecentMetricSnapshots } from "@/src/modules/investor-metrics/metricsSnapshot";
import type { PitchMetrics, PitchSlideSpec } from "./types";

function growthPct(current: number, prior: number): number {
  if (prior <= 0) return current > 0 ? 100 : 0;
  return ((current - prior) / prior) * 100;
}

/** Live + snapshot-backed metrics for investor slides. */
export async function loadPitchMetrics(): Promise<PitchMetrics> {
  const [snapshots, live] = await Promise.all([
    getRecentMetricSnapshots(40),
    aggregateSnapshotInputs(new Date()),
  ]);

  const newest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];
  let userGrowthRatePct = 0;
  if (newest && oldest && newest.id !== oldest.id) {
    userGrowthRatePct = growthPct(newest.totalUsers, oldest.totalUsers);
  }

  return {
    totalUsers: live.totalUsers,
    activeUsers: live.activeUsers,
    listings: live.totalListings,
    bookings30d: live.bookings,
    revenue30d: live.revenue,
    conversionRate: live.conversionRate,
    userGrowthRatePct,
    snapshotDate: newest ? utcDayStart(newest.date).toISOString().slice(0, 10) : null,
  };
}

export function generateTitleSlide(metrics: PitchMetrics): PitchSlideSpec {
  return {
    order: 0,
    type: "title",
    title: "LECIPM",
    content: {
      subtitle: "Quebec real estate, BNHub stays, and broker-grade CRM — one platform.",
      asOf: metrics.snapshotDate ?? new Date().toISOString().slice(0, 10),
      bullets: ["Data-driven investor narrative", "Numbers refresh from live platform telemetry"],
    },
  };
}

export function generateProblemSlide(): PitchSlideSpec {
  return {
    order: 1,
    type: "problem",
    title: "The problem",
    content: {
      bullets: [
        "Fragmented tools for listings, short-term stays, and professional workflows",
        "Low trust and opaque conversion from browse → booking → close",
        "Brokers and hosts lack unified revenue, CRM, and execution telemetry",
      ],
    },
  };
}

export function generateSolutionSlide(): PitchSlideSpec {
  return {
    order: 2,
    type: "solution",
    title: "Our solution",
    content: {
      bullets: [
        "Single LECIPM surface: marketplace + BNHub + broker workspace",
        "Trust-forward flows, ranking, and operational dashboards",
        "Measurable pipeline: leads, bookings, and monetization events in one ledger",
      ],
    },
  };
}

export function generateProductSlide(): PitchSlideSpec {
  return {
    order: 3,
    type: "product",
    title: "Product",
    content: {
      bullets: [
        "FSBO & assisted listings, buyer hub, mortgage / expert modules",
        "BNHub: published stays, bookings, payouts, and host growth tools",
        "CRM: pipeline, playbooks, revenue opportunities, and admin intelligence",
      ],
    },
  };
}

export function generateTractionSlide(metrics: PitchMetrics): PitchSlideSpec {
  return {
    order: 4,
    type: "traction",
    title: "Traction (live metrics)",
    content: {
      bullets: [
        `Total users: ${metrics.totalUsers.toLocaleString()}`,
        `Active users (30d touch): ${metrics.activeUsers.toLocaleString()}`,
        `Listings (BNHub + FSBO active): ${metrics.listings.toLocaleString()}`,
        `Bookings (30d, confirmed/completed): ${metrics.bookings30d.toLocaleString()}`,
        `Platform revenue (30d, attributed events): $${metrics.revenue30d.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        `Lead conversion (won ÷ won+lost, 30d): ${(metrics.conversionRate * 100).toFixed(1)}%`,
      ],
      metrics: {
        totalUsers: metrics.totalUsers,
        activeUsers: metrics.activeUsers,
        listings: metrics.listings,
        bookings30d: metrics.bookings30d,
        revenue30d: metrics.revenue30d,
        conversionRate: metrics.conversionRate,
      },
    },
  };
}

export function generateBusinessModelSlide(): PitchSlideSpec {
  return {
    order: 5,
    type: "business_model",
    title: "Business model",
    content: {
      bullets: [
        "Take rate on stays, lead marketplace, and broker SaaS tiers",
        "Workspace subscriptions and premium listing / promotion SKUs",
        "Deepening ARPU via CRM monetization and financial services adjacencies",
      ],
    },
  };
}

export function generateGrowthSlide(metrics: PitchMetrics): PitchSlideSpec {
  return {
    order: 6,
    type: "growth",
    title: "Growth",
    content: {
      bullets: [
        `User growth (vs oldest snapshot in 40d window): ${metrics.userGrowthRatePct.toFixed(1)}%`,
        "Multi-city rollout, SEO + growth engine, referral and execution loops",
        "Expand supply (hosts/listings) and demand (buyers/investors) with measurable unit economics",
      ],
      userGrowthRatePct: metrics.userGrowthRatePct,
    },
  };
}

export function generateVisionSlide(): PitchSlideSpec {
  return {
    order: 7,
    type: "vision",
    title: "Vision",
    content: {
      bullets: [
        "Default operating system for Quebec real estate transactions and stays",
        "Institutional-grade trust, data, and revenue visibility",
        "Scale across cities while keeping broker and host economics healthy",
      ],
    },
  };
}

export function buildSlideSpecs(metrics: PitchMetrics): PitchSlideSpec[] {
  return [
    generateTitleSlide(metrics),
    generateProblemSlide(),
    generateSolutionSlide(),
    generateProductSlide(),
    generateTractionSlide(metrics),
    generateBusinessModelSlide(),
    generateGrowthSlide(metrics),
    generateVisionSlide(),
  ];
}

/** Persist a new deck with slides from current platform metrics. */
export async function buildDeck(title = "LECIPM — Investor deck") {
  const metrics = await loadPitchMetrics();
  const specs = buildSlideSpecs(metrics);

  return prisma.$transaction(async (tx) => {
    const deck = await tx.pitchDeck.create({
      data: { title },
    });
    await tx.pitchDeckSlide.createMany({
      data: specs.map((s) => ({
        deckId: deck.id,
        order: s.order,
        type: s.type,
        title: s.title,
        content: s.content as Prisma.InputJsonValue,
      })),
    });
    return tx.pitchDeck.findUniqueOrThrow({
      where: { id: deck.id },
      include: { slides: { orderBy: { order: "asc" } } },
    });
  });
}
