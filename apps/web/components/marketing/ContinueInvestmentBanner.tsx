"use client";

import { useEffect, useState } from "react";
import { AnalyzeLinkButton } from "@/components/marketing/AnalyzeLinkButton";
import { shouldShowContinueInvestmentHint } from "@/lib/investment/activation-storage";

/**
 * Shown on the homepage when localStorage indicates a prior investment flow (draft or progress).
 */
export function ContinueInvestmentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowContinueInvestmentHint());
  }, []);

  if (!visible) return null;

  return (
    <div className="relative z-10 border-b border-emerald-500/25 bg-gradient-to-r from-emerald-950/50 to-[#0B0B0B] px-4 py-3 text-center">
      <p className="text-sm text-emerald-100">
        <span className="font-semibold text-white">Continue your investment analysis</span>
        {" — "}
        <AnalyzeLinkButton
          href="/analyze#analyzer"
          linkClassName="pointer-events-auto relative z-30 inline align-baseline"
          className="min-h-0 bg-transparent p-0 text-sm font-medium text-emerald-300 underline shadow-none ring-0 hover:text-white"
        >
          Open the deal analyzer
        </AnalyzeLinkButton>
      </p>
      <p className="mt-1 text-xs font-medium text-emerald-200/95">
        Try analyzing another property — compare more deals side by side.
      </p>
      <p className="mt-1 text-xs text-emerald-200/80">
        Your last inputs are restored automatically when you open Analyze.
      </p>
    </div>
  );
}
