/**
 * BNHub market-rate context for hosts and guests.
 * Uses aggregate prices from published listings on this marketplace only — not live OTA scraping.
 */

import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateSmartPrice } from "@/lib/bnhub/smart-pricing";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

const DISCLAIMER =
  "Estimate based on other published stays in this city on BNHub. Not a quote or appraisal; external sites may differ.";

export type BnhubMarketInsightPayload = {
  listingId: string;
  city: string;
  country: string;
  currency: string;
  yourNightCents: number;
  peerAvgNightCents: number | null;
  peerListingCount: number;
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
  const { city, currency, yourNightCents, peerAvg, peerCount, pct, demand, recommended } = input;
  const guest: string[] = [];
  const host: string[] = [];

  if (peerAvg != null && peerAvg > 0 && peerCount >= 2) {
    const absPct = pct != null ? Math.abs(Math.round(pct)) : 0;
    if (pct != null && pct < -3) {
      guest.push(
        `This nightly rate is about ${absPct}% below the typical published range in ${city} on BNHub — strong value if the listing fits your trip.`,
      );
    } else if (pct != null && pct > 3) {
      guest.push(
        `This rate is about ${absPct}% above the typical published range in ${city} on BNHub — compare amenities, location, and reviews before you book.`,
      );
    } else {
      guest.push(`This rate is close to the typical range for ${city} on BNHub (${money(peerAvg, currency)}/night across ${peerCount} published stays).`);
    }
  } else {
    guest.push(
      peerCount < 2
        ? `There are few comparable published stays in ${city} on BNHub yet — use reviews and photos to judge value.`
        : `We don’t have enough peer pricing in ${city} on BNHub to compare — check similar listings manually.`,
    );
  }

  guest.push(
    demand === "high"
      ? "Demand looks elevated in this city recently — earlier dates can fill faster."
      : demand === "medium"
        ? "Booking a bit ahead of peak weekends often gives you more choice on BNHub."
        : "Softer demand signal in this city on BNHub — hosts may be open to questions on longer stays.",
  );

  if (peerAvg != null && peerAvg > 0) {
    host.push(
      `Peer average in ${city} on BNHub: ${money(peerAvg, currency)}/night across ${peerCount} published listings.`,
    );
    host.push(`Suggested nightly anchor from demand + seasonality: ${money(recommended, currency)} (informational).`);
  } else {
    host.push(`Not enough peer listings in ${city} on BNHub to compute a city average — set price from your costs and OTA comps you paste into channel tools.`);
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
          content: `You refine bullet points about short-term rental pricing on one marketplace (BNHub). Rules:
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

  const smart = await generateSmartPrice(listingId);
  const cur = (listing.currency ?? "USD").toUpperCase();
  const peerAvg = smart.marketAvgCents;
  const pct =
    peerAvg != null && peerAvg > 0
      ? ((listing.nightPriceCents - peerAvg) / peerAvg) * 100
      : null;

  let { guest, host } = templateBullets({
    city: listing.city,
    currency: cur,
    yourNightCents: listing.nightPriceCents,
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
    yourNightCents: listing.nightPriceCents,
    peerAvgNightCents: peerAvg,
    peerListingCount: smart.peerListingCount,
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
