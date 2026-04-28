"use client";

import dynamic from "next/dynamic";
import type { DrBrainMetrics } from "@/lib/drbrain/metrics";
import { DRBRAIN_INVESTOR_DEMO_KPIS } from "@/lib/drbrain/demo-data";
import type { DrBrainChartsLabels } from "@/components/admin/DrBrainCharts";

/** ORDER SYBNB-86 — Recharts loads only on the client (cannot use `ssr: false` inside Server Components). */
const DrBrainCharts = dynamic(() => import("@/components/admin/DrBrainCharts").then((m) => m.DrBrainCharts), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] rounded-2xl border border-stone-200 bg-stone-50" aria-busy />
  ),
});

const DrBrainInvestorDemoCharts = dynamic(
  () =>
    import("@/components/admin/drbrain/DrBrainInvestorDemoCharts").then((m) => m.DrBrainInvestorDemoCharts),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] rounded-2xl border border-stone-200 bg-stone-50" aria-busy />
    ),
  },
);

type Props = {
  investorDemo: boolean;
  kpis?: typeof DRBRAIN_INVESTOR_DEMO_KPIS;
  metrics: DrBrainMetrics;
  chartLabels: DrBrainChartsLabels;
  demoBanner?: string;
};

export function DrBrainChartsLazyGate({
  investorDemo,
  kpis,
  metrics,
  chartLabels,
  demoBanner,
}: Props) {
  if (investorDemo && kpis) {
    return (
      <DrBrainInvestorDemoCharts metrics={metrics} kpis={kpis} demoBanner={demoBanner} />
    );
  }
  return <DrBrainCharts metrics={metrics} labels={chartLabels} />;
}
