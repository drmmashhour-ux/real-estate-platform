import type { Metadata } from "next";

import { AiSuggestion, DealPanel, KpiCard } from "@/components";

export const metadata: Metadata = {
  title: "LECIPM Console",
  description: "Broker operations overview — KPIs, deal intelligence, AI suggestions.",
};

export default function LecipmConsoleHomePage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Leads" value="24" />
        <KpiCard title="Deals" value="8" />
        <KpiCard title="Conversion" value="32%" />
        <KpiCard title="Revenue" value="$4,200" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DealPanel score={82} probability={74} riskLevel="Low" />
        <AiSuggestion message="Follow up within 24h" />
      </div>
    </div>
  );
}
