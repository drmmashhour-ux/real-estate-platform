/**
 * BNHUB market-rate context for hosts and guests.
 * Uses aggregate prices from published listings on this marketplace only — not live OTA scraping.
 */

import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateSmartPrice, MAX_PERCENT_VS_PEER_DISPLAY } from "@/lib/bnhub/smart-pricing";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

const DISCLAIMER =
  "Estimate based on other published stays in this city on BNHUB. Not a quote or appraisal; external sites may differ.";

export type BnhubMarketInsightPayload = {
  listingId: string;
  city: string;
  country: string;
  currency: string;
  yourNightCents: number;
  peerAvgNightCents: number | null;
  peerListingCount: number;
  /** BNHUB booking count last 30d across published stays in this city (demand signal). */
  peerBookingsLast30dInCity: number;
  /** Bookings for this listing in the last 30d (active pipeline statuses). */
  listingBookingsLast30d: number;
  recommendedNightCents: number;
  confidenceLabel: "low" | "medium" | "high";
  demandLevel: "low" | "medium" | "high";
  percentVsPeerAvg: number | null;
  guestBullets: string[];
  hostBullets: string[];
  disclaimer: string;
  aiEnhanced: boolean;
};

function money(cents: number, currency: string): string {
  const n = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.length === 3 ? currency : "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n.toFixed(0)}`;
  }
}

function templateBullets(input: {
  city: string;
  currency: string;
  yourNightCents: number;
  peerAvg: number | null;
  peerCount: number;
  pct: number | null;
  demand: "low" | "medium" | "high";
  recommended: number;
}): { guest: string[]; host: string[] } {
  const { city, currency, peerAvg, peerCount, pct, demand, recommended } = input;
  const guest: string[] = [];
  const host: string[] = [];

  if (peerAvg != null && peerAvg > 0 && peerCount >= 2) {
    const absPct = pct != null ? Math.abs(Math.round(pct)) : 0;
    if (pct != null && pct < -3) {
      guest.push(
        `This nightly rate is about ${absPct}% below the typical published range in ${city} on BNHUB — strong value if the listing fits your trip.`,
      );
    } else if (pct != null && pct > 3) {
      guest.push(
        `This rate is about ${absPct}% above the typical published range in ${city} on BNHUB — compare amenities, location, and reviews before you book.`,
      );
    } else {
      guest.push(`This rate is close to the typical range for ${city} on BNHUB (${money(peerAvg, currency)}/night across ${peerCount} published stays).`);
    }
  } else {
    guest.push(
      peerCount < 2
        ? `There are few comparable published stays in ${city} on BNHUB yet — use reviews and photos to judge value.`
        : `We don’t have enough peer pricing in ${city} on BNHUB to compare — check similar listings manually.`,
    );
  }

  guest.push(
    demand === "high"
      ? "Demand looks elevated in this city recently — earlier dates can fill faster."
      : demand === "medium"
        ? "Booking a bit ahead of peak weekends often gives you more choice on BNHUB."
        : "Softer demand signal in this city on BNHUB — hosts may be open to questions on longer stays.",
  );

  if (peerAvg != null && peerAvg > 0) {
    host.push(
      `Peer average in ${city} on BNHUB: ${money(peerAvg, currency)}/night across ${peerCount} published listings.`,
    );
    host.push(`Suggested nightly anchor from demand + seasonality: ${money(recommended, currency)} (informational).`);
  } else {
    host.push(`Not enough peer listings in ${city} on BNHUB to compute a city average — set price from your costs and OTA comps you paste into channel tools.`);
  }
  host.push("If you list on other channels, keep nightly rates in sync to avoid double-bookings.");

  return { guest, host };
}

async function maybeEnhanceWithAi(input: {
  guestBullets: string[];
  hostBullets: string[];
}): Promise<{ guestBullets: string[]; hostBullets: string[] } | null> {
  const client = openai;
  if (!isOpenAiConfigured() || !client) return null;
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 350,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You refine bullet points about short-term rental pricing on one marketplace (BNHUB). Rules:
- Do not claim live prices from Airbnb, Booking.com, airlines, or other OTAs.
- Preserve facts and numbers; tighten wording only.
- JSON: {"guestBullets": string[], "hostBullets": string[]} — at most 2 strings per array.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            guestBullets: input.guestBullets,
            hostBullets: input.hostBullets,
          }),
        },
      ],
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { guestBullets?: string[]; hostBullets?: string[] };
    const g = Array.isArray(parsed.guestBullets) ? parsed.guestBullets.filter((x) => typeof x === "string").slice(0, 2) : [];
    const h = Array.isArray(parsed.hostBullets) ? parsed.hostBullets.filter((x) => typeof x === "string").slice(0, 2) : [];
    if (g.length === 0 && h.length === 0) return null;
    return {
      guestBullets: g.length ? g : input.guestBullets,
      hostBullets: h.length ? h : input.hostBullets,
    };
  } catch {
    return null;
  }
}

export async function getBnhubMarketInsightForListing(
  listingId: string,
  options?: { useAi?: boolean; hostUserId?: string }
): Promise<BnhubMarketInsightPayload | null> {
  const listing = await prisma.shortTermListing.findFirst({
    where: {
      id: listingId,
      ...(options?.hostUserId
        ? { ownerId: options.hostUserId }
        : { listingStatus: ListingStatus.PUBLISHED }),
    },
    select: {
      id: true,
      city: true,
      country: true,
      nightPriceCents: true,
      currency: true,
    },
  });
  if (!listing) return null;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [smart, listingBookingsLast30d] = await Promise.all([
    generateSmartPrice(listingId),
    prisma.booking.count({
      where: {
        listingId,
        createdAt: { gte: since },
        status: { in: ["CONFIRMED", "COMPLETED", "AWAITING_HOST_APPROVAL", "PENDING"] },
      },
    }),
  ]);
  const cur = (listing.currency ?? "USD").toUpperCase();
  const peerAvg = smart.marketAvgCents;
  const yourNight = Number.isFinite(listing.nightPriceCents) ? listing.nightPriceCents : 0;
  const rawPct =
    peerAvg != null && peerAvg > 0 ? ((yourNight - peerAvg) / peerAvg) * 100 : null;
  const pct =
    rawPct != null && Number.isFinite(rawPct)
      ? Math.max(-MAX_PERCENT_VS_PEER_DISPLAY, Math.min(MAX_PERCENT_VS_PEER_DISPLAY, rawPct))
      : null;

  let { guest, host } = templateBullets({
    city: listing.city,
    currency: cur,
    yourNightCents: yourNight,
    peerAvg,
    peerCount: smart.peerListingCount,
    pct,
    demand: smart.demandLevel,
    recommended: smart.recommendedPriceCents,
  });

  let aiEnhanced = false;
  if (options?.useAi) {
    const refined = await maybeEnhanceWithAi({
      guestBullets: guest,
      hostBullets: host,
    });
    if (refined) {
      guest = refined.guestBullets.length ? refined.guestBullets : guest;
      host = refined.hostBullets.length ? refined.hostBullets : host;
      aiEnhanced = true;
    }
  }

  return {
    listingId: listing.id,
    city: listing.city,
    country: listing.country,
    currency: cur,
    yourNightCents: yourNight,
    peerAvgNightCents: peerAvg,
    peerListingCount: smart.peerListingCount,
    peerBookingsLast30dInCity: smart.peerBookingsLast30d,
    listingBookingsLast30d,
    recommendedNightCents: smart.recommendedPriceCents,
    confidenceLabel: smart.confidence,
    demandLevel: smart.demandLevel,
    percentVsPeerAvg: pct,
    guestBullets: guest,
    hostBullets: host,
    disclaimer: DISCLAIMER,
    aiEnhanced,
  };
}

export async function getBnhubMarketInsightForPublishedListing(
  listingId: string,
  options?: { useAi?: boolean }
): Promise<BnhubMarketInsightPayload | null> {
  return getBnhubMarketInsightForListing(listingId, options);
}

const PEER_COMPARE_THRESHOLD_PCT = 3;

/**
 * Single factual line for booking price breakdown (BNHUB peer listings only; not date-adjusted).
 * Uses the same ±threshold band as template guest bullets.
 */
export function bnhubBookingPriceInsightDecisionLine(
  insight: Pick<
    BnhubMarketInsightPayload,
    "city" | "peerAvgNightCents" | "peerListingCount" | "percentVsPeerAvg"
  >
): string {
  const { peerAvgNightCents, peerListingCount, percentVsPeerAvg } = insight;
  if (
    peerAvgNightCents == null ||
    peerAvgNightCents <= 0 ||
    peerListingCount < 2 ||
    percentVsPeerAvg == null ||
    !Number.isFinite(percentVsPeerAvg)
  ) {
    return "Not enough comparable stays in this area on BNHUB to benchmark — use photos, reviews, and amenities to decide.";
  }
  const pct = percentVsPeerAvg;
  if (pct > PEER_COMPARE_THRESHOLD_PCT) {
    return "This price is above typical for this area compared with similar published stays on BNHUB.";
  }
  if (pct < -PEER_COMPARE_THRESHOLD_PCT) {
    return "This price is below typical for this area compared with similar published stays on BNHUB.";
  }
  return "This price is typical for this area.";
}
