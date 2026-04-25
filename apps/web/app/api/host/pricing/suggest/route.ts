import { getGuestId } from "@/lib/auth/session";
import { isReasonableListingId } from "@/lib/api/safe-params";
import { assertHostOwnsListing, requireBnhubHostAccess } from "@/lib/host/require-bnhub-host-access";
import { logPricingAiSuggestion } from "@/modules/pricing-ai/pricing-ai.logger";
import { suggestDynamicPrice } from "@/modules/pricing-ai/pricing.engine";
import { buildPricingAiSignalBundle } from "@/modules/pricing-ai/signals.loader";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/pricing/suggest — advisory dynamic price for a host-owned BNHub listing.
 * Never mutates listing state; hosts apply explicitly via PATCH /api/host/listings/[id].
 */
export async function GET(req: Request) {
  const userId = await getGuestId();
  const gate = await requireBnhubHostAccess(userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  const url = new URL(req.url);
  const listingId = url.searchParams.get("listingId")?.trim() ?? "";
  if (!listingId || !isReasonableListingId(listingId)) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const owns = await assertHostOwnsListing(gate.userId, listingId);
  if (!owns) return Response.json({ error: "Not found" }, { status: 404 });

  const checkInRaw = url.searchParams.get("checkIn")?.trim();
  let checkIn: Date | undefined;
  if (checkInRaw) {
    const d = new Date(checkInRaw);
    if (Number.isNaN(d.getTime())) {
      return Response.json({ error: "Invalid checkIn" }, { status: 400 });
    }
    checkIn = d;
  }

  const eventBoostRaw = url.searchParams.get("eventBoost");
  let eventDemand01: number | undefined;
  if (eventBoostRaw != null && eventBoostRaw !== "") {
    const n = Number(eventBoostRaw);
    if (!Number.isFinite(n) || n < 0 || n > 1) {
      return Response.json({ error: "eventBoost must be between 0 and 1" }, { status: 400 });
    }
    eventDemand01 = n;
  }

  const row = await prisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: gate.userId },
    select: {
      id: true,
      title: true,
      nightPriceCents: true,
      city: true,
      beds: true,
      propertyType: true,
      pricingMode: true,
      currency: true,
    },
  });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  if (!Number.isFinite(row.nightPriceCents) || row.nightPriceCents <= 0) {
    return Response.json({ error: "Listing base price is missing or invalid" }, { status: 400 });
  }

  const listingInput = {
    id: row.id,
    nightPriceCents: row.nightPriceCents,
    city: row.city,
    beds: row.beds,
    propertyType: row.propertyType,
    pricingMode: row.pricingMode,
  };

  const signals = await buildPricingAiSignalBundle(listingInput, { checkIn, eventDemand01 });
  const suggestion = suggestDynamicPrice(listingInput, signals);

  logPricingAiSuggestion({
    listingId: row.id.slice(0, 8),
    baseCents: row.nightPriceCents,
    suggestedCents: suggestion.suggestedPriceCents,
    deltaPct: suggestion.priceDeltaPct,
    pricingMode: suggestion.pricingMode,
    safetyClamped: suggestion.safetyClamped,
  });

  return Response.json({
    listingId: row.id,
    title: row.title,
    currency: row.currency ?? "USD",
    currentPriceCents: row.nightPriceCents,
    ...suggestion,
    signals: {
      locationDemand01: signals.locationDemand01,
      seasonalityFactor: signals.seasonalityFactor,
      nearbyListingMedianCents: signals.nearbyListingMedianCents,
      nearbyListingSampleSize: signals.nearbyListingSampleSize,
      similarPropertyMedianCents: signals.similarPropertyMedianCents,
      similarPropertySampleSize: signals.similarPropertySampleSize,
      occupancyRate01: signals.occupancyRate01,
      bookingLeadTimeDays: signals.bookingLeadTimeDays,
      eventDemand01: signals.eventDemand01,
    },
    transparency: {
      hostOverrideAlways: true,
      suggestionOnly: true,
      maxChangePctEachWay: 30,
    },
  });
}
