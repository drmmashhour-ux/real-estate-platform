"use client";

import { useEffect, useState } from "react";
import { DealCompareClient } from "@/app/compare/deal-compare-client";
import { ensureDemoDealsSeeded } from "@/lib/investment/demo-deals-storage";
import type { SerializableInvestmentDeal } from "@/lib/investment/investment-deal-types";

export default function DemoComparePage() {
  const [deals, setDeals] = useState<SerializableInvestmentDeal[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDeals(ensureDemoDealsSeeded());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
          role="status"
          aria-label="Loading compare"
        />
        <p className="text-sm text-slate-500">Loading saved deals…</p>
      </div>
    );
  }

  return <DealCompareClient deals={deals} variant="demo" />;
}
