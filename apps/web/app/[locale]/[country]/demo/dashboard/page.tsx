"use client";

import { useEffect, useState } from "react";
import { PortfolioDashboardClient, type DashboardDealRow } from "@/components/investment/PortfolioDashboardClient";
import { ensureDemoDealsSeeded } from "@/lib/investment/demo-deals-storage";
import { RENTAL_TYPE } from "@/lib/investment/rental-model";

export default function DemoDashboardPage() {
  const [deals, setDeals] = useState<DashboardDealRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const list = ensureDemoDealsSeeded();
    setDeals(
      list.map((d) => ({
        id: d.id,
        rentalType: d.rentalType ?? RENTAL_TYPE.LONG_TERM,
        preferredStrategy: d.preferredStrategy ?? d.rentalType ?? RENTAL_TYPE.LONG_TERM,
        propertyPrice: d.propertyPrice,
        monthlyRent: d.monthlyRent,
        monthlyExpenses: d.monthlyExpenses,
        nightlyRate: d.nightlyRate ?? null,
        occupancyRate: d.occupancyRate ?? null,
        roiLongTerm: d.roiLongTerm ?? null,
        roiShortTerm: d.roiShortTerm ?? null,
        roi: d.roi,
        riskScore: d.riskScore,
        rating: d.rating,
        city: d.city,
        marketComparison: d.marketComparison,
        createdAt: d.createdAt,
      }))
    );
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
          role="status"
          aria-label="Loading demo portfolio"
        />
        <p className="text-sm text-slate-500">Loading demo portfolio…</p>
      </div>
    );
  }

  return <PortfolioDashboardClient deals={deals} variant="demo" demoHint />;
}
