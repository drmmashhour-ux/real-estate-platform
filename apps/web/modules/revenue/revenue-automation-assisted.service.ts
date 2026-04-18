/**
 * Pre-filled assisted payloads — copy/navigate only; never applies pricing or sends mail by itself.
 */

import type { AssistedPayload } from "./revenue-automation.types";
import type { MoneyOperatingSystemSnapshot } from "./money-os.types";
import type { MosMarketRuntime } from "@/config/country";

export function buildBrokerOutreachDraft(
  snapshot: MoneyOperatingSystemSnapshot,
  country: MosMarketRuntime,
): string {
  const n = Math.min(14, Math.max(6, snapshot.meta.leadsViewedWeek > 20 ? 10 : 8));
  return [
    `[${country.countryCode} — broker outreach — draft]`,
    `We're seeing ${snapshot.meta.leadsViewedWeek} lead views / ${snapshot.meta.leadsUnlockedWeek} unlocks (7d).`,
    `Goal: recover unlock rate — quick call to confirm pricing clarity and listing freshness.`,
    `Suggested touches today: ${n} brokers with recent CRM activity.`,
    `Do not change prices from this template — confirm with ops.`,
  ].join("\n");
}

export function buildListingFixHighlight(snapshot: MoneyOperatingSystemSnapshot): string {
  const weak = snapshot.sources.filter((s) => s.health !== "GOOD");
  const names = weak.map((s) => s.label).join(", ") || "priority inventory";
  return `Highlight listings needing fixes: ${names}. Week revenue $${snapshot.revenueWeek.toFixed(0)} — prioritize photo/description gaps on ${names}.`;
}

export function buildPricingAdvisoryNote(snapshot: MoneyOperatingSystemSnapshot): string {
  return [
    "Pricing advisory (not applied):",
    snapshot.progress.gapMessageToday,
    `Booking completion ${(snapshot.meta.bookingCompletionRate * 100).toFixed(0)}%.`,
    "Review BNHub fee capture vs guest-facing totals before changing list prices.",
  ].join(" ");
}

export function assistedBundleForLeakTitle(
  title: string,
  snapshot: MoneyOperatingSystemSnapshot,
  country: MosMarketRuntime,
): AssistedPayload | undefined {
  const base: AssistedPayload = {
    navigatePath: "/admin/brokers",
    copyBlock: buildBrokerOutreachDraft(snapshot, country),
  };

  if (/unlock|Lead|lead|broker/i.test(title)) {
    return {
      ...base,
      brokerOutreachDraft: buildBrokerOutreachDraft(snapshot, country),
      navigatePath: "/admin/brokers",
    };
  }
  if (/featured|Featured|subscription/i.test(title)) {
    return {
      listingFixHighlight: buildListingFixHighlight(snapshot),
      navigatePath: "/admin/listings",
      pricingAdvisoryNote: buildPricingAdvisoryNote(snapshot),
    };
  }
  if (/BNHub|booking|checkout|Booking/i.test(title)) {
    return {
      pricingAdvisoryNote: buildPricingAdvisoryNote(snapshot),
      navigatePath: "/admin/bnhub",
      copyBlock: `BNHub funnel: ${snapshot.meta.bookingStartsWeek} starts → ${snapshot.meta.bookingCompletedWeek} completed. Guest checkout review recommended.`,
    };
  }
  return undefined;
}
