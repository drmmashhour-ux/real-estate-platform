import { buildRetargetingAudiences, type RetargetingAudiences } from "./retargeting-audience.service";
import { analyzeBookingFunnel } from "@/modules/growth/booking-funnel-analysis.service";
import {
  getTopMessagesBySegment,
  getWeakMessages,
  retargetingPerformanceReady,
} from "@/modules/growth/retargeting-performance.service";
import { croRetargetingDurabilityFlags, oneBrainV3Flags } from "@/config/feature-flags";
import { retargetingStrength01 } from "@/modules/platform-core/brain-v3-runtime-cache";
import {
  getTopRetargetingMessagesBySegmentDurability,
  getWeakRetargetingMessagesDurability,
} from "@/modules/growth/cro-retargeting-durability.repository";
import type { RetargetingPerformance } from "@/modules/growth/retargeting-performance.service";

function marketCityLabel(): string {
  return process.env.NEXT_PUBLIC_MARKET_CITY_LABEL?.trim() || "Montréal";
}

export type RetargetingPlanItem = {
  segment: keyof RetargetingAudiences;
  label: string;
  message: string;
  suggestedCopy: string;
  urgency: "low" | "medium" | "high";
  frequency: string;
};

export type RetargetingPlan = {
  rangeDays: number;
  audiences: RetargetingAudiences;
  items: RetargetingPlanItem[];
  funnelNote: string;
  /** Explicit links between funnel gaps and suggested plays (Phase 8). */
  funnelLinkedSuggestions: { condition: string; play: string }[];
};

/**
 * Human-readable retargeting plan for ops (Meta/Google UIs) — no API calls.
 */
export async function generateRetargetingPlan(rangeDays = 14): Promise<RetargetingPlan> {
  const [audiences, funnel] = await Promise.all([
    buildRetargetingAudiences(rangeDays),
    analyzeBookingFunnel(rangeDays),
  ]);

  const items: RetargetingPlanItem[] = [];

  const city = marketCityLabel();

  await retargetingPerformanceReady();

  if (audiences.highIntent.count > 0) {
    const tops =
      croRetargetingDurabilityFlags.croRetargetingDurabilityV1 ?
        await getTopRetargetingMessagesBySegmentDurability("highIntent", 2)
      : await getTopMessagesBySegment("highIntent", 2);
    const weak =
      croRetargetingDurabilityFlags.croRetargetingDurabilityV1 ?
        await getWeakRetargetingMessagesDurability(12)
      : await getWeakMessages("highIntent");
    const weakList = weak;
    const avoid = new Set(weakList.map((w: RetargetingPerformance) => w.messageId));
    const learned =
      tops.find((t: RetargetingPerformance) => !avoid.has(t.messageId)) ?? tops[0];
    const base = `Still looking for a stay in ${city}? Don’t miss these listings 👇 — book with secure Stripe checkout.`;
    const suggestedCopy = learned
      ? `${base} (Top learned message id: ${learned.messageId}, conv ${(learned.conversionRate * 100).toFixed(1)}% — manual paste in ad UI.)`
      : base;
    const learnedSource: RetargetingPlanItem["learnedSource"] =
      croRetargetingDurabilityFlags.croRetargetingDurabilityV1 ? "DB"
      : tops.length > 0 ? "MEMORY"
      : "DEFAULT";
    let whySuggested =
      learned ?
        tops.length > 0 ?
          "Ranked from stored performance snapshots (clicks + conversion proxy)."
        : "No ranked messages — template only."
      : "Insufficient learned volume — template copy.";
    const v3Strength = oneBrainV3Flags.oneBrainV3CrossDomainV1 ? retargetingStrength01() : 0;
    if (oneBrainV3Flags.oneBrainV3CrossDomainV1 && v3Strength > 0.35) {
      whySuggested += ` · Brain V3 cross-domain strength ${v3Strength.toFixed(2)} (ADS/CRO/RT signals — capped heuristic).`;
    }
    let urgency: RetargetingPlanItem["urgency"] = "medium";
    if (oneBrainV3Flags.oneBrainV3CrossDomainV1 && v3Strength > 0.55) urgency = "high";
    items.push({
      segment: "highIntent",
      label: "High intent — listing viewers",
      message: "Re-engage users who viewed stays or homes but have not booked.",
      suggestedCopy,
      urgency,
      frequency: "3×/week for 10 days, then pause losers (<1% CTR).",
      learnedSource,
      evidenceQuality:
        learned && "evidenceQuality" in learned ? (learned as { evidenceQuality?: string | null }).evidenceQuality ?? null : null,
      whySuggested,
    });
  }

  if (audiences.abandonedBookings.count > 0) {
    items.push({
      segment: "abandonedBookings",
      label: "Abandoned checkout",
      message: "Users with unpaid or unconfirmed BNHub bookings.",
      suggestedCopy: "Your booking is almost complete — secure your stay now",
      urgency: "high",
      frequency: "Daily for 3 days, then 2 reminders spaced 48h apart.",
    });
  }

  if (audiences.hotLeads.count > 0) {
    items.push({
      segment: "hotLeads",
      label: "Lead captured, no booking signal",
      message: "CRM leads without a completed booking milestone in the measurement window.",
      suggestedCopy: "We saved your request — reply with your dates and we’ll hold the best nightly rate we can offer.",
      urgency: "high",
      frequency: "2×/week + one SMS/email if consented.",
    });
  }

  if (audiences.engaged.count > 0 && audiences.highIntent.count < audiences.engaged.count) {
    items.push({
      segment: "engaged",
      label: "Engaged — clicked CTA",
      message: "Warm users who clicked tracked CTAs.",
      suggestedCopy: "You started on LECIPM — continue to verified BNHub stays with transparent nightly pricing.",
      urgency: "low",
      frequency: "2×/week broad retargeting.",
    });
  }

  if (audiences.visitors.count > 0 || (audiences.visitors.anonymousSessions ?? 0) > 0) {
    items.push({
      segment: "visitors",
      label: "Visitors — top of funnel",
      message: "Landing and home traffic that may need social proof.",
      suggestedCopy: "Discover smarter stays in Québec — verified listings where shown, secure booking.",
      urgency: "low",
      frequency: "1×/week awareness + creative refresh weekly.",
    });
  }

  const funnelLinkedSuggestions: { condition: string; play: string }[] = [];
  if (audiences.highIntent.count > 0 && funnel.counts.bookingCompleted === 0) {
    funnelLinkedSuggestions.push({
      condition: "High-intent listing views but no completed booking events in this window",
      play: "Prioritize highIntent retargeting + featured placements (see plan items).",
    });
  }
  if (funnel.counts.bookingStarted > 0 && funnel.counts.bookingCompleted < funnel.counts.bookingStarted) {
    funnelLinkedSuggestions.push({
      condition: "booking_started recorded but completion/payment still lagging",
      play: "Use urgency recovery copy for abandoned checkout (abandonedBookings audience) and verify the guest flow.",
    });
  }

  return {
    rangeDays,
    audiences,
    items,
    funnelNote: funnel.recommendation,
    funnelLinkedSuggestions,
  };
}
