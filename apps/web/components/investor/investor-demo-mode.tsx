"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type DemoStep = { id: string; title: string; description: string };

const DEFAULT_STEPS: DemoStep[] = [
  { id: "pitch-overview", title: "Platform overview", description: "Multi-hub OS, AI layer, growth engine." },
  { id: "pitch-market", title: "Market position", description: "Real estate + marketplace + AI narrative." },
  { id: "pitch-metrics", title: "Live metrics", description: "Users, listings, bookings, leads, revenue." },
  { id: "pitch-revenue", title: "Revenue by hub", description: "BNHub, Broker, Listings, Residence, Investor." },
  { id: "pitch-growth", title: "Growth", description: "Daily / weekly velocity charts." },
  { id: "pitch-ai", title: "AI system", description: "Insights and growth actions." },
  { id: "pitch-story", title: "Story", description: "Problem → vision narrative blocks." },
  { id: "pitch-export", title: "Exports", description: "PDF deck, summary, financial JSON." },
];

export function InvestorDemoWalkthrough({
  enabled,
  steps = DEFAULT_STEPS,
}: {
  enabled: boolean;
  steps?: DemoStep[];
}) {
  const [visible, setVisible] = useState(true);
  const [idx, setIdx] = useState(0);

  const step = steps[idx];

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (enabled && visible && step) scrollTo(step.id);
  }, [enabled, visible, step, scrollTo]);

  const progress = useMemo(() => `${idx + 1} / ${steps.length}`, [idx, steps.length]);

  if (!enabled) return null;

  if (!visible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          className="rounded-full border border-[#D4AF37]/45 bg-black/90 px-4 py-2 text-xs font-semibold text-[#D4AF37] shadow-lg backdrop-blur-md"
          onClick={() => setVisible(true)}
        >
          Guided tour
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div className="pointer-events-auto max-w-lg rounded-2xl border border-[#D4AF37]/35 bg-black/95 px-5 py-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">
              Demo walkthrough · {progress}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">{step?.title}</h3>
            <p className="mt-1 text-sm text-white/75">{step?.description}</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
            onClick={() => setVisible(false)}
          >
            Hide
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-[#D4AF37]/90 px-4 py-2 text-xs font-semibold text-black hover:bg-[#D4AF37] disabled:opacity-40"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
          >
            Back
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#D4AF37]/90 px-4 py-2 text-xs font-semibold text-black hover:bg-[#D4AF37] disabled:opacity-40"
            onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
            disabled={idx >= steps.length - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
