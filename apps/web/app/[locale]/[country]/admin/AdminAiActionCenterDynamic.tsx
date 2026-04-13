"use client";

import dynamic from "next/dynamic";
import type { HubTheme } from "@/lib/hub/themes";

const AiActionCenter = dynamic(
  () => import("@/components/ai/AiActionCenter").then((m) => m.AiActionCenter),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-white/10 p-6 text-slate-500">Loading AI…</div>
    ),
  }
);

type Recommendation = {
  id: string;
  title: string;
  description: string;
  urgency: "high" | "low" | "medium";
  actionLabel: string;
  actionHref: string;
};

export function AdminAiActionCenterDynamic({
  hubType,
  recommendations,
  theme,
  performanceSummary,
}: {
  hubType: "admin";
  recommendations: Recommendation[];
  theme: HubTheme;
  performanceSummary: string;
}) {
  return (
    <AiActionCenter
      hubType={hubType}
      recommendations={recommendations}
      theme={theme}
      performanceSummary={performanceSummary}
    />
  );
}
