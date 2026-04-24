"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LaunchSequencerOutput } from "@/modules/launch-sequencer/launch-sequencer.types";

/**
 * Compact fetch-and-display strip for command center / investor / executive surfaces.
 */
export function LaunchSequencerSummaryStrip(props: { dashboardHref?: string }) {
  const href = props.dashboardHref ?? "/dashboard/launch-sequencer";
  const [data, setData] = useState<LaunchSequencerOutput | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/launch-sequencer", { credentials: "include" });
        const j = (await res.json()) as { ok?: boolean; sequence?: LaunchSequencerOutput };
        if (!cancelled && res.ok && j.sequence) setData(j.sequence);
      } catch {
        if (!cancelled) setData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data?.recommendations.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-neutral-500">
        <p className="font-semibold text-neutral-400">Launch sequencer</p>
        <p className="mt-1">Advisory rollout plan unavailable or still loading.</p>
        <Link href={href} className="mt-2 inline-block text-[#D4AF37]/80 hover:text-[#D4AF37]">
          Open sequencer →
        </Link>
      </div>
    );
  }

  const top = data.recommendations[0];
  return (
    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]/90">Launch sequencer (scenario)</p>
      <p className="mt-2 text-sm text-neutral-200">
        Top slot: <span className="font-medium text-[#f4efe4]">{top?.marketKey}</span> · {top?.launchMode.replace(/_/g, " ")} · readiness{" "}
        {top?.readiness.score}
      </p>
      {data.topBlockers[0] ?
        <p className="mt-1 text-xs text-amber-200/80">Blocker: {data.topBlockers[0]}</p>
      : null}
      <p className="mt-2 text-[11px] text-neutral-500">{data.dataQualityNote}</p>
      <Link href={href} className="mt-2 inline-block text-xs font-medium text-[#D4AF37] hover:underline">
        Full rollout table →
      </Link>
    </div>
  );
}
