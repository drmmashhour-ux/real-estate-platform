"use client";

import { useEffect, useState } from "react";
import { AnalyzeLinkButton } from "@/components/marketing/AnalyzeLinkButton";
import {
  dismissContinueInvestmentBanner,
  shouldShowContinueInvestmentReturnBanner,
} from "@/lib/investment/activation-storage";

/** Same session logic as homepage strip; dismiss shares key so users aren’t nagged twice. */
export function DashboardReturnBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowContinueInvestmentReturnBanner());
  }, []);

  if (!visible) return null;

  return (
    <div
      className="flex flex-col gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <p>
        <span className="font-semibold text-white">Continue your investment analysis</span>
        {" — "}
        pick up where you left off or run a new scenario.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <AnalyzeLinkButton
          href="/analyze"
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
        >
          Open analyzer
        </AnalyzeLinkButton>
        <button
          type="button"
          className="text-xs text-emerald-400/80 underline hover:text-white"
          onClick={() => {
            dismissContinueInvestmentBanner();
            setVisible(false);
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
