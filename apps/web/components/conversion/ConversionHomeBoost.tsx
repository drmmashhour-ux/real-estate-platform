"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useConversionEngineFlags } from "@/lib/conversion/use-conversion-engine-flags";
import { buildInstantValueSummary } from "@/modules/conversion/instant-value.service";
import type { InstantValueIntent } from "@/modules/conversion/instant-value.types";
import { TrustStrip } from "@/components/shared/TrustStrip";
import { IntentSelector } from "@/components/shared/IntentSelector";
import { recordConversionHeroClick } from "@/modules/conversion/conversion-monitoring.service";

/**
 * Above-the-fold boost for default marketing home — only when FEATURE_CONVERSION_UPGRADE_V1.
 */
export function ConversionHomeBoost() {
  const conversionEngineFlags = useConversionEngineFlags();
  const [intent, setIntent] = useState<InstantValueIntent>("buy");

  const summary = useMemo(() => {
    if (!conversionEngineFlags.instantValueV1) return null;
    return buildInstantValueSummary({ page: "home", intent });
  }, [intent, conversionEngineFlags.instantValueV1]);

  if (!conversionEngineFlags.conversionUpgradeV1) return null;

  return (
    <section className="border-t border-white/10 bg-black px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        {summary ? (
          <>
            <h2 className="text-balance text-2xl font-semibold text-white sm:text-3xl">{summary.headline}</h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-300 sm:text-base">{summary.subheadline}</p>
          </>
        ) : (
          <>
            <h2 className="text-balance text-2xl font-semibold text-white sm:text-3xl">
              Move faster from search to serious opportunity
            </h2>
            <p className="mt-3 text-pretty text-sm text-slate-400">
              Pick your lane — we keep pricing and verification visible where the listing supports it.
            </p>
          </>
        )}

        <div className="mt-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">I&apos;m focused on</p>
          <IntentSelector value={intent} onChange={setIntent} />
        </div>

        {summary && conversionEngineFlags.instantValueV1 ? (
          <ul className="mx-auto mt-6 max-w-xl space-y-2 text-left text-sm text-slate-300">
            {summary.insights.slice(0, 3).map((i) => (
              <li key={i.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="font-medium text-premium-gold">{i.title}</span>
                <span className="mt-1 block text-xs text-slate-400">{i.description}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/get-leads"
            className="inline-flex min-h-[52px] min-w-[220px] items-center justify-center rounded-xl bg-premium-gold px-6 text-base font-bold text-black transition hover:brightness-110"
            onClick={() => {
              if (conversionEngineFlags.conversionUpgradeV1) {
                recordConversionHeroClick({ surface: "home", intent, href: "/get-leads" });
              }
            }}
          >
            {summary?.ctaLabel ?? "Get matched"}
          </Link>
          <Link
            href="/listings"
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-premium-gold/50 px-6 text-base font-semibold text-premium-gold transition hover:bg-premium-gold/10"
            onClick={() => {
              if (conversionEngineFlags.conversionUpgradeV1) {
                recordConversionHeroClick({ surface: "home", intent, href: "/listings" });
              }
            }}
          >
            Browse listings
          </Link>
        </div>

        <div className="mt-8">
          <TrustStrip lines={summary?.trustLines} />
        </div>
      </div>
    </section>
  );
}
