"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type P = { ok?: boolean; strategy?: { summary: { headline: string; bullets: string[] } }; featureDisabled?: boolean; disclaimer?: string };

/**
 * One-line link-out for investor intelligence page — brief API only. Non-financial guarantee: strategy is operations advisory.
 */
export function InvestorCorporateStrategyBlurb() {
  const [t, setT] = useState<string | null>(null);
  const [off, setOff] = useState(false);
  const run = useCallback(() => {
    void fetch("/api/corporate-strategy?summaryOnly=1", { credentials: "include" })
      .then((r) => r.json() as Promise<P>)
      .then((j) => {
        if (j.featureDisabled) {
          setOff(true);
          return;
        }
        if (j.ok && j.strategy) {
          setT((j.strategy.summary.bullets[0] ?? j.strategy.summary.headline) ?? null);
        }
      })
      .catch(() => setT(null));
  }, []);
  useEffect(() => {
    void run();
  }, [run]);
  if (off) {
    return (
      <p className="text-xs text-slate-500">
        Corporate strategy layer: enable <code>FEATURE_CORPORATE_STRATEGY_V1</code> to show linked operational priorities (advisory, not a valuation or promise).
      </p>
    );
  }
  if (!t) return null;
  return (
    <p className="text-xs text-slate-600">
      <span className="text-slate-500">Also see </span>
      <Link className="font-medium text-slate-800 underline" href="/dashboard/corporate-strategy">
        corporate strategy
      </Link>
      <span className="text-slate-500"> — {t}</span>
    </p>
  );
}
