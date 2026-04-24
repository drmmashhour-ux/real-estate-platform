"use client";

import Link from "next/link";
import type { DreamHomeMatchResult } from "@/modules/dream-home/types/dream-home.types";
import { DreamHomeTraitCard } from "./DreamHomeTraitCard";

type Props = {
  result: DreamHomeMatchResult;
  basePath: string;
};

function priceFmt(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

export function DreamHomeResults({ result, basePath }: Props) {
  const { profile, listings, tradeoffs, source } = result;

  return (
    <div className="mt-10 space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="rounded-full border border-white/10 px-2 py-0.5">
          {source === "ai" ? "Profile: AI narrative" : "Profile: deterministic (set OPENAI_API_KEY for AI)"}
        </span>
      </div>

      <DreamHomeTraitCard label="Your home profile">{profile.householdProfile}</DreamHomeTraitCard>

      <div>
        <h2 className="text-lg font-semibold text-white">Recommended characteristics</h2>
        <ul className="mt-2 list-inside list-disc text-slate-300">
          {profile.propertyTraits.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">Neighborhood</h2>
        <ul className="mt-2 list-inside list-disc text-slate-300">
          {profile.neighborhoodTraits.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">Why this fits (from your answers)</h2>
        <ul className="mt-2 list-inside list-disc text-slate-300">
          {profile.rationale.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">Listings that match your filters</h2>
        {listings.length === 0 ? (
          <p className="mt-2 text-slate-400">No public listings matched — try widening city or budget in the form.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {listings.map((L) => (
              <li
                key={L.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row"
              >
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-44">
                  {L.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- signed / CDN hosts vary
                    <img
                      src={L.coverImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-white/5 text-xs text-slate-500">No image</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">
                    Match score {L.matchScore.toFixed(2)} · {L.city}
                    {L.propertyType ? ` · ${L.propertyType}` : ""}
                  </p>
                  <h3 className="mt-1 font-semibold text-white">{L.title}</h3>
                  <p className="mt-1 text-sm text-premium-gold">
                    {priceFmt(L.priceCents)} · {L.bedrooms ?? "—"} bd · {L.bathrooms ?? "—"} ba
                  </p>
                  <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
                    {L.whyThisFits.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                  <Link
                    href={`${basePath}/listings/${L.id}`}
                    className="mt-3 inline-block text-sm font-medium text-premium-gold hover:underline"
                  >
                    View listing
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">Tradeoffs</h2>
        <ul className="mt-2 list-inside list-disc text-slate-400">
          {tradeoffs.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
