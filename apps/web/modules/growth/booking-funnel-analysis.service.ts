import { prisma } from "@/lib/db";

export type FunnelDropOffStage = {
  label: string;
  fromCount: number;
  toCount: number;
  ratePercent: number | null;
};

export type CroEngineHintIssue = "listing_page" | "checkout_trust" | "landing_to_listing" | "none";

export type BookingFunnelAnalysis = {
  windowDays: number;
  since: string;
  counts: {
    pageViews: number;
    landingViews: number;
    listingViews: number;
    ctaClicks: number;
    leadCaptures: number;
    bookingStarted: number;
    bookingCompleted: number;
  };
  rates: {
    viewToListingPercent: number | null;
    listingToCheckoutPercent: number | null;
    checkoutToPaidPercent: number | null;
  };
  /** Ordered stages: visitors → listing → checkout → payment. */
  dropOffs: FunnelDropOffStage[];
  bottleneck: "traffic" | "consideration" | "checkout" | "payment" | "none";
  recommendation: string;
  /** LECIPM CRO — structured bottleneck for dashboards (orthogonal to `bottleneck`). */
  croEngineHints: {
    dominantIssue: CroEngineHintIssue;
    reason: string;
  };
};

function pct(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

export async function analyzeBookingFunnel(windowDays: number): Promise<BookingFunnelAnalysis> {
  const since = new Date(Date.now() - windowDays * 864e5);
  const [
    pageViews,
    landingViews,
    listingViews,
    ctaClicks,
    leadCaptures,
    bookingStarted,
    bookingCompleted,
  ] = await Promise.all([
    prisma.growthEvent.count({
      where: { createdAt: { gte: since }, eventName: "page_view" },
    }),
    prisma.growthEvent.count({
      where: { createdAt: { gte: since }, eventName: "landing_view" },
    }),
    prisma.growthEvent.count({
      where: { createdAt: { gte: since }, eventName: "listing_view" },
    }),
    prisma.growthEvent.count({
      where: { createdAt: { gte: since }, eventName: "cta_click" },
    }),
    prisma.growthEvent.count({
      where: { createdAt: { gte: since }, eventName: "lead_capture" },
    }),
    prisma.growthEvent.count({
      where: { createdAt: { gte: since }, eventName: "booking_started" },
    }),
    prisma.growthEvent.count({
      where: { createdAt: { gte: since }, eventName: "booking_completed" },
    }),
  ]);

  const topFunnel = pageViews + landingViews;
  const viewToListing = pct(listingViews, Math.max(1, topFunnel));
  const listingToCheckout = pct(bookingStarted, Math.max(1, listingViews));
  const checkoutToPaid = pct(bookingCompleted, Math.max(1, bookingStarted));

  let bottleneck: BookingFunnelAnalysis["bottleneck"] = "none";
  let recommendation =
    "Funnel looks balanced — keep UTMs consistent and refresh top listings in paid campaigns.";

  if (topFunnel < 50) {
    bottleneck = "traffic";
    recommendation = "Top-of-funnel is thin — increase paid + organic reach before optimizing conversion.";
  } else if ((viewToListing ?? 0) < 5) {
    bottleneck = "consideration";
    recommendation = "Traffic is not reaching listing detail — improve search relevance, pricing clarity, and retargeting to high-intent viewers.";
  } else if ((listingToCheckout ?? 0) < 3) {
    bottleneck = "checkout";
    recommendation = "Listing views are not converting to checkout — tighten BNHub trust signals, availability, and reduce booking friction.";
  } else if ((checkoutToPaid ?? 0) < 40 && bookingStarted > 5) {
    bottleneck = "payment";
    recommendation = "Checkout starts stall before payment — verify Stripe health, guest identity gates, and send urgency recovery messages.";
  }

  const visitors = pageViews + landingViews;
  const dropOffs: FunnelDropOffStage[] = [
    {
      label: "Visitors → listing views",
      fromCount: visitors,
      toCount: listingViews,
      ratePercent: viewToListing,
    },
    {
      label: "Listing views → checkout started",
      fromCount: listingViews,
      toCount: bookingStarted,
      ratePercent: listingToCheckout,
    },
    {
      label: "Checkout started → booking completed",
      fromCount: bookingStarted,
      toCount: bookingCompleted,
      ratePercent: checkoutToPaid,
    },
  ];

  let croDominant: CroEngineHintIssue = "none";
  let croReason = "No dominant CRO issue inferred from funnel rates.";
  if (bottleneck === "consideration") {
    croDominant = "landing_to_listing";
    croReason = "Low share of sessions reach listing detail — improve discovery and relevance.";
  } else if (bottleneck === "checkout") {
    croDominant = "listing_page";
    croReason = "Listing views are not starting checkout — review trust, pricing, and availability signals.";
  } else if (bottleneck === "payment") {
    croDominant = "checkout_trust";
    croReason = "Checkout starts are not completing payment — review Stripe path and guest friction.";
  }

  return {
    windowDays,
    since: since.toISOString(),
    counts: {
      pageViews,
      landingViews,
      listingViews,
      ctaClicks,
      leadCaptures,
      bookingStarted,
      bookingCompleted,
    },
    rates: {
      viewToListingPercent: viewToListing,
      listingToCheckoutPercent: listingToCheckout,
      checkoutToPaidPercent: checkoutToPaid,
    },
    dropOffs,
    bottleneck,
    recommendation,
    croEngineHints: {
      dominantIssue: croDominant,
      reason: croReason,
    },
  };
}
