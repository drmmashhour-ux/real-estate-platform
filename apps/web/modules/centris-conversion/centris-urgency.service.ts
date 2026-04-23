import { prisma } from "@/lib/db";

import { logConversion } from "./centris-funnel.log";

export type CentrisUrgencyPayload = {
  /** Short lines for UI chips */
  stripLines: string[];
  /** Single paragraph for email body */
  emailParagraph: string;
  /** Structured facts for A/B or analytics */
  facts: {
    viewerCount: number;
    priceChangedRecently: boolean;
    visitsLimitedCopy: boolean;
  };
};

const PRICE_CHANGE_WINDOW_HOURS = 72;

/**
 * Deterministic urgency copy — uses listing intelligence already on-platform (no fabricated humans).
 */
export async function buildCentrisUrgencySignals(listingId: string): Promise<CentrisUrgencyPayload> {
  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      updatedAt: true,
      priceCents: true,
      city: true,
      status: true,
    },
  });

  if (fsbo) {
    const since30 = new Date(Date.now() - 30 * 86400000);
    const viewerCount = await prisma.buyerListingView.count({
      where: { fsboListingId: fsbo.id, createdAt: { gte: since30 } },
    });

    const hoursSinceUpdate = (Date.now() - fsbo.updatedAt.getTime()) / 3600000;
    const priceChangedRecently = hoursSinceUpdate <= PRICE_CHANGE_WINDOW_HOURS;

    const stripLines: string[] = [];
    if (viewerCount >= 8) {
      stripLines.push(`${viewerCount}+ buyers viewed this home recently`);
    } else if (viewerCount >= 3) {
      stripLines.push(`Active interest — ${viewerCount} recent listing views`);
    } else {
      stripLines.push("Fresh activity on this listing — move before the next comparable sells.");
    }

    if (priceChangedRecently) {
      stripLines.push("Listing updated recently — pricing may still be settling.");
    }

    const visitsLimitedCopy = fsbo.status === "ACTIVE";
    if (visitsLimitedCopy) {
      stripLines.push("Broker-led visits are limited — book early to compare condition vs photos.");
    }

    const emailParagraph = [
      stripLines[0],
      stripLines.find((l) => l.includes("updated")) ?? null,
      stripLines.find((l) => l.includes("visits")) ?? null,
    ]
      .filter(Boolean)
      .join(" ");

    logConversion("urgency_built", { listingId, viewerCount });

    return {
      stripLines: stripLines.slice(0, 4),
      emailParagraph,
      facts: {
        viewerCount,
        priceChangedRecently,
        visitsLimitedCopy,
      },
    };
  }

  const crm = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { updatedAt: true, city: true, price: true },
  });

  if (crm) {
    const hoursSinceUpdate = (Date.now() - crm.updatedAt.getTime()) / 3600000;
    const priceChangedRecently = hoursSinceUpdate <= PRICE_CHANGE_WINDOW_HOURS;
    const stripLines = [
      priceChangedRecently
        ? "CRM listing refreshed recently — confirm availability with the broker."
        : "Broker-managed listing — schedule directly for the freshest status.",
      crm.city ? `Market: ${crm.city}` : "Market activity varies week to week.",
    ];
    return {
      stripLines,
      emailParagraph: stripLines.join(" "),
      facts: { viewerCount: 0, priceChangedRecently, visitsLimitedCopy: true },
    };
  }

  return {
    stripLines: ["High demand windows are short — leave your details to hold your place in line."],
    emailParagraph: "Demand for quality listings moves quickly — confirm your interest to stay ahead.",
    facts: { viewerCount: 0, priceChangedRecently: false, visitsLimitedCopy: true },
  };
}
