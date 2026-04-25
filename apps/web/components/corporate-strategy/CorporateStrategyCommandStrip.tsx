"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Brief = {
  periodKey: string;
  generatedAt: string;
  summary: { headline: string; bullets: string[] };
  bottlenecksHeadline: string | null;
  riskHeadline: string | null;
};

type Payload = {
  ok?: boolean;
  strategy?: Brief;
  featureDisabled?: boolean;
  message?: string;
  disclaimer?: string;
  brief?: boolean;
};

/**
 * High-level link-out; brief fetch only. Same auth as /api/corporate-strategy.
 */
export function CorporateStrategyCommandStrip() {
  const [p, setP] = useState<Payload | null>(null);
  const load = useCallback(() => {
    void fetch("/api/corporate-strategy?summaryOnly=1", { credentials: "include" })
      .then((r) => r.json() as Promise<Payload>)
      .then((j) => {
        if (j.ok) setP(j);
      })
      .catch(() => setP({ ok: false }));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!p) return null;
  if (p.featureDisabled) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-neutral-300">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B8C5D6]/90">Corporate strategy</p>
        <p className="mt-1 text-xs text-neutral-500">Enable <code className="text-[10px]">FEATURE_CORPORATE_STRATEGY_V1</code> for hiring, budget, and Q-plan views.</p>
        <Link href="/dashboard/corporate-strategy" className="mt-1 inline-block text-xs text-[#D4AF37] hover:underline">
          Open (broker/admin) →
        </Link>
      </div>
    );
  }
  if (!p.strategy) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-neutral-300">
        <Link href="/dashboard/corporate-strategy" className="text-xs text-[#D4AF37] hover:underline">
          Corporate strategy →
        </Link>
      </div>
    );
  }
  const t = p.strategy.summary.bullets[0] ?? p.strategy.summary.headline;
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-[#f4efe4]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B8C5D6]/90">Corporate strategy (brief)</p>
      <p className="mt-1 line-clamp-3 text-xs text-neutral-300">
        {t}. <span className="text-neutral-500">Bottleneck signal: {p.strategy.bottlenecksHeadline ?? "—"}. Risk: {p.strategy.riskHeadline ?? "—"}. (Advisory.)</span>
      </p>
      <Link href="/dashboard/corporate-strategy" className="mt-1 inline-block text-xs text-[#D4AF37] hover:underline">
        Full view →
      </Link>
    </div>
  );
}
