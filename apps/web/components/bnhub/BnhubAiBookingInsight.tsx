import { Sparkles } from "lucide-react";
import type { BnhubMarketInsightPayload } from "@/lib/bnhub/market-price-insight";
import { resolveAiBookingInsightLines } from "@/lib/bnhub/bnhub-booking-insight";

export function BnhubAiBookingInsight({ market }: { market: BnhubMarketInsightPayload }) {
  const lines = resolveAiBookingInsightLines({
    demandLevel: market.demandLevel,
    peerListingCount: market.peerListingCount,
    yourNightCents: market.yourNightCents,
    recommendedNightCents: market.recommendedNightCents,
    hasSelectedDates: false,
    leadDaysUntilCheckIn: null,
    calendarTightForDates: false,
  });
  const display =
    lines.length > 0
      ? lines
      : ["Insight reflects BNHUB marketplace signals for this listing."];
  return (
    <div className="rounded-xl border border-[#006ce4]/20 bg-gradient-to-br from-sky-50 to-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0 text-[#006ce4]" aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-800">AI Booking Insight</p>
      </div>
      <div className="mt-2 space-y-1.5 text-sm font-medium leading-snug text-slate-900">
        {display.slice(0, 2).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}
