"use client";

import Link from "next/link";
import {
  analyzeBnhubListingContentQuality,
  bnhubAutopilotMessageSuggestions,
  bnhubAutopilotPromotionIdeas,
  bnhubHostGrowthTips,
  predictBnhubOccupancyBand,
  suggestBnhubNightlyPriceDeltaPercent,
} from "@/modules/bnhub/recommendationEngine";

export type HostInsightListing = {
  id: string;
  listingCode: string;
  title: string;
  nightPriceCents: number;
  description: string | null;
  photos: unknown;
  amenities: unknown;
  bnhubListingCompletedStays: number;
  bnhubListingReviewCount: number;
  bnhubListingRatingAverage: number | null;
};

function photoCount(photos: unknown): number {
  return Array.isArray(photos) ? photos.filter((p) => typeof p === "string").length : 0;
}

function amenitiesCount(amenities: unknown): number {
  return Array.isArray(amenities) ? amenities.length : 0;
}

export function BnhubHostInsightsClient({
  listings,
  basePath,
}: {
  listings: HostInsightListing[];
  basePath: string;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 text-white">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/85">BNHub host</p>
        <h1 className="text-3xl font-semibold tracking-tight">Insights &amp; autopilot suggestions</h1>
        <p className="max-w-2xl text-sm text-white/60">
          Pricing, occupancy, and messaging ideas are suggestions only — nothing is auto-applied to your live listing.
        </p>
        <Link href={`${basePath}/dashboard/bnhub/host`} className="inline-block text-sm text-[#D4AF37] hover:underline">
          ← Host dashboard
        </Link>
      </header>

      <section className="rounded-2xl border border-[#D4AF37]/25 bg-black/50 p-5">
        <h2 className="text-lg font-semibold text-[#D4AF37]">Autopilot (manual review)</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-medium text-white">Message suggestions</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/70">
              {bnhubAutopilotMessageSuggestions().map((s) => (
                <li key={s.slice(0, 24)}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-medium text-white">Promotion ideas</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/70">
              {bnhubAutopilotPromotionIdeas().map((s) => (
                <li key={s.slice(0, 24)}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {listings.length === 0 ? (
        <p className="text-sm text-white/55">No published short-term listings on this account yet.</p>
      ) : (
        <div className="space-y-6">
          {listings.map((l) => {
            const qc = analyzeBnhubListingContentQuality({
              photoCount: photoCount(l.photos),
              description: l.description,
              amenitiesCount: amenitiesCount(l.amenities),
            });
            const priceHint = suggestBnhubNightlyPriceDeltaPercent({
              nightPriceCents: l.nightPriceCents,
              completedStays: l.bnhubListingCompletedStays,
              reviewAverage: l.bnhubListingRatingAverage,
            });
            const occ = predictBnhubOccupancyBand({
              completedStaysLast90Days: Math.min(12, l.bnhubListingCompletedStays),
              reviewAverage: l.bnhubListingRatingAverage,
            });
            const growthTips = bnhubHostGrowthTips({
              suggestedPriceDeltaPercent: priceHint.suggestedDeltaPercent,
              priceRationale: priceHint.rationale,
              occLow: occ.lowPct,
              occHigh: occ.highPct,
              occNote: occ.note,
            });
            return (
              <article key={l.id} className="rounded-2xl border border-white/10 bg-[#0C0C0C] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-medium text-white">{l.title}</h2>
                    <p className="mt-1 font-mono text-xs text-white/45">{l.listingCode}</p>
                  </div>
                  <Link
                    href={`/bnhub/stays/${encodeURIComponent(l.listingCode)}`}
                    className="rounded-full border border-[#D4AF37]/40 px-3 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  >
                    View as guest
                  </Link>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <h3 className="text-sm font-semibold text-[#D4AF37]">Pricing suggestion</h3>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-white">
                      {priceHint.suggestedDeltaPercent > 0 ? "+" : ""}
                      {priceHint.suggestedDeltaPercent}%
                    </p>
                    <p className="mt-2 text-sm text-white/65">{priceHint.rationale}</p>
                    <p className="mt-2 text-xs text-white/45">Current nightly: ${(l.nightPriceCents / 100).toFixed(0)} — adjust manually in host tools.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <h3 className="text-sm font-semibold text-[#D4AF37]">Occupancy prediction</h3>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {occ.lowPct}%–{occ.highPct}%
                    </p>
                    <p className="mt-2 text-sm text-white/65">{occ.note}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-4">
                  <h3 className={`text-sm font-semibold ${qc.ok ? "text-emerald-200" : "text-amber-100"}`}>{qc.headline}</h3>
                  {!qc.ok ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
                      {qc.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-white/65">Photos, description, and amenities look sufficient for discovery.</p>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="text-sm font-semibold text-white">Growth &amp; improvement tips</h3>
                  <p className="mt-1 text-xs text-white/45">
                    Pricing, demand, and promotion ideas — suggestions only; your listing quality checklist is above.
                  </p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-white/70">
                    {growthTips.map((tip, idx) => (
                      <li key={`${l.id}-growth-${idx}`}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
