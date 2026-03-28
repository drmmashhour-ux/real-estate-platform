"use client";

import { useMemo, useState } from "react";
import type { ProductInsightsPayload } from "@/modules/analytics/services/product-insights-queries";
import { AnalyticsDashboardClient } from "./analytics-dashboard-client";
import { PlatformAnalyticsDashboard } from "./platform-analytics-dashboard";
import { ProductInsightsDashboard } from "./product-insights-dashboard";

type Tab = "marketing" | "platform" | "product";

export function AdminAnalyticsShell({ productInsights }: { productInsights: ProductInsightsPayload }) {
  const [tab, setTab] = useState<Tab>("marketing");

  const tabs = useMemo(
    () =>
      [
        { id: "marketing" as const, label: "Marketing & ads" },
        { id: "platform" as const, label: "Platform metrics" },
        { id: "product" as const, label: "Product & feedback" },
      ] as const,
    []
  );

  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/30 p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-premium-gold text-black shadow-md shadow-premium-gold/25"
                : "text-[#B3B3B3] hover:bg-white/5 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "marketing" ? <AnalyticsDashboardClient /> : null}
      {tab === "platform" ? <PlatformAnalyticsDashboard /> : null}
      {tab === "product" ? <ProductInsightsDashboard data={productInsights} /> : null}
    </div>
  );
}
