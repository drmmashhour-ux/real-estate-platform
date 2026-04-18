import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import { subDays } from "date-fns";
import type { FunnelReport } from "./funnel.types";
import { detectDropoffs, fixesForGuestBnhub } from "./dropoff-detector.service";
import { getGrowthEventWindowCounts } from "./conversion-tracker.service";

const WINDOW = 90;

export async function buildGuestBnhubFunnel(): Promise<FunnelReport> {
  const growth = await getGrowthEventWindowCounts(WINDOW);

  const steps = [
    { key: "view_listing", label: "Listing view (growth)", count: growth.view_listing ?? 0 },
    { key: "booking_start", label: "Booking start", count: growth.booking_start ?? 0 },
    { key: "booking_complete", label: "Booking complete", count: growth.booking_complete ?? 0 },
  ];

  const dropoffPoints = detectDropoffs(steps);
  const first = steps[0]?.count ?? 0;
  const last = steps[steps.length - 1]?.count ?? 0;
  const conversionRate = first > 0 ? Math.round((1000 * last) / first) / 10 : null;

  return {
    funnelId: "guest_bnhub",
    windowDays: WINDOW,
    steps,
    conversionRate,
    dropoffPoints,
    recommendedFixes: fixesForGuestBnhub(dropoffPoints),
  };
}

export async function buildHostFunnel(): Promise<FunnelReport> {
  const growth = await getGrowthEventWindowCounts(WINDOW);
  const steps = [
    { key: "signup", label: "Signup", count: growth.signup ?? 0 },
    { key: "create_listing", label: "Create listing", count: growth.create_listing ?? 0 },
    { key: "booking_complete", label: "First booking complete (proxy)", count: growth.booking_complete ?? 0 },
  ];
  const dropoffPoints = detectDropoffs(steps);
  const first = steps[0]?.count ?? 0;
  const last = steps[steps.length - 1]?.count ?? 0;
  return {
    funnelId: "host_bnhub",
    windowDays: WINDOW,
    steps,
    conversionRate: first > 0 ? Math.round((1000 * last) / first) / 10 : null,
    dropoffPoints,
    recommendedFixes: [
      "Separate host activation steps in instrumentation (publish, Stripe Connect) for clearer drop-offs.",
    ],
  };
}

export async function buildFunnelBundle(): Promise<{ guest: FunnelReport; host: FunnelReport }> {
  const [guest, host] = await Promise.all([buildGuestBnhubFunnel(), buildHostFunnel()]);
  return { guest, host };
}

/** Buyer-side residential funnel — counts from platform data only (no fabricated demand). */
export async function buildBuyerFsboFunnel(): Promise<FunnelReport> {
  const since = subDays(new Date(), WINDOW);
  const [buyerAccounts, fsboInquiries, dealsActive, dealsClosed] = await Promise.all([
    prisma.user.count({ where: { role: PlatformRole.BUYER, createdAt: { gte: since } } }),
    prisma.lead.count({
      where: { fsboListingId: { not: null }, createdAt: { gte: since } },
    }),
    prisma.deal.count({
      where: {
        createdAt: { gte: since },
        status: { notIn: ["closed", "cancelled"] },
      },
    }),
    prisma.deal.count({
      where: {
        createdAt: { gte: since },
        status: "closed",
      },
    }),
  ]);

  const steps = [
    { key: "buyer_signups", label: "Buyer role signups (window)", count: buyerAccounts },
    { key: "fsbo_inquiries", label: "FSBO listing inquiries", count: fsboInquiries },
    { key: "deals_open", label: "Deals opened (non-terminal)", count: dealsActive },
    { key: "deals_closed", label: "Deals closed", count: dealsClosed },
  ];
  const dropoffPoints = detectDropoffs(steps);
  const first = steps[0]?.count ?? 0;
  const last = steps[steps.length - 1]?.count ?? 0;
  return {
    funnelId: "buyer_fsbo",
    windowDays: WINDOW,
    steps,
    conversionRate: first > 0 ? Math.round((1000 * last) / first) / 10 : null,
    dropoffPoints,
    recommendedFixes: [
      "Tie CRM stages to `Lead` + `Deal` for finer conversion; current steps are aggregate proxies.",
    ],
  };
}

export async function buildBrokerPlatformFunnel(): Promise<FunnelReport> {
  const since = subDays(new Date(), WINDOW);
  const [brokerSignups, dealsWithBroker, dealsClosed] = await Promise.all([
    prisma.user.count({ where: { role: PlatformRole.BROKER, createdAt: { gte: since } } }),
    prisma.deal.count({
      where: { brokerId: { not: null }, createdAt: { gte: since } },
    }),
    prisma.deal.count({
      where: { brokerId: { not: null }, status: "closed", updatedAt: { gte: since } },
    }),
  ]);

  const steps = [
    { key: "broker_signups", label: "Broker role signups", count: brokerSignups },
    { key: "deals_assigned", label: "Deals with broker assigned", count: dealsWithBroker },
    { key: "deals_closed_broker", label: "Deals closed (broker-attributed)", count: dealsClosed },
  ];
  const dropoffPoints = detectDropoffs(steps);
  const first = steps[0]?.count ?? 0;
  const last = steps[steps.length - 1]?.count ?? 0;
  return {
    funnelId: "broker_platform",
    windowDays: WINDOW,
    steps,
    conversionRate: first > 0 ? Math.round((1000 * last) / first) / 10 : null,
    dropoffPoints,
    recommendedFixes: [
      "Instrument broker onboarding milestones (first lead, first deal) for clearer activation.",
    ],
  };
}

export async function buildFullFunnelBundle(): Promise<{
  guest: FunnelReport;
  host: FunnelReport;
  buyer: FunnelReport;
  broker: FunnelReport;
}> {
  const [guest, host, buyer, broker] = await Promise.all([
    buildGuestBnhubFunnel(),
    buildHostFunnel(),
    buildBuyerFsboFunnel(),
    buildBrokerPlatformFunnel(),
  ]);
  return { guest, host, buyer, broker };
}
