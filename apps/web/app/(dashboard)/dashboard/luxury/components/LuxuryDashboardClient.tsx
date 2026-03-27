"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AiActionCenter } from "@/components/ai/AiActionCenter";
import type { HubTheme } from "@/lib/hub/themes";

const GOLD = "#C9A96E";

type LuxuryData = {
  template: { name: string; reason: string };
  insights: { luxuryAppealScore: number; suggestions: string[] };
  fallbacks: { insights?: string };
  aiCopy: { headline: string; body: string; cta: string };
  top3: { projectId: string; rank: number; reason: string; score: number }[];
};

type Props = { theme: HubTheme };

export function LuxuryDashboardClient({ theme }: Props) {
  const [data, setData] = useState<LuxuryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/luxury")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const recommendations = [
    {
      id: "1",
      title: "Luxury branding",
      description:
        typeof data?.fallbacks?.insights === "string"
          ? data.fallbacks.insights
          : "Premium positioning and high-end copy perform best for affluent buyers.",
      urgency: "medium" as const,
      actionLabel: "Open templates",
      actionHref: "/forms",
    },
    {
      id: "2",
      title: "Target premium audience",
      description: "Use luxury templates and concierge messaging to attract high-net-worth clients.",
      urgency: "low" as const,
      actionLabel: "Design Studio",
      actionHref: "/tools/design-studio",
    },
  ];

  if (loading || !data) {
    return (
      <div className="space-y-[30px]">
        <PremiumCard accent={GOLD} style={{ padding: 28, borderRadius: 18 }}>
          <p className="text-slate-500">Loading AI insights…</p>
        </PremiumCard>
        <PremiumCard accent={GOLD} style={{ padding: 28, borderRadius: 18 }}>
          <p className="text-slate-500">Loading design studio…</p>
        </PremiumCard>
        <PremiumCard accent={GOLD} style={{ padding: 28, borderRadius: 18 }}>
          <p className="text-slate-500">Loading opportunities…</p>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="space-y-[30px]">
      <PremiumCard accent={GOLD} style={{ padding: 28, borderRadius: 18 }}>
        <h2 className="text-xl font-semibold" style={{ color: GOLD }}>
          AI Luxury Insights
        </h2>
        <p className="mt-2 text-2xl font-bold text-white">
          Luxury Appeal Score: <span style={{ color: GOLD }}>{data.insights.luxuryAppealScore}</span>/100
        </p>
        <div className="mt-4 max-w-md">
          <ProgressBar value={data.insights.luxuryAppealScore} label="Luxury Appeal" accent={GOLD} gradient />
        </div>
        <ul className="mt-6 space-y-2">
          {data.insights.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span style={{ color: GOLD }}>•</span>
              {s}
            </li>
          ))}
        </ul>
      </PremiumCard>

      <PremiumCard accent={GOLD} style={{ padding: 28, borderRadius: 18 }}>
        <h2 className="text-xl font-semibold" style={{ color: GOLD }}>
          Luxury Design Studio
        </h2>
        <p className="mt-3 text-sm text-slate-400">
          Template: <strong style={{ color: GOLD }}>{data.template.name}</strong> — {data.template.reason}
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">AI generated copy</p>
          <p className="mt-1 font-medium text-white">{data.aiCopy.headline}</p>
          <p className="mt-1 text-sm text-slate-400">{data.aiCopy.body}</p>
          <p className="mt-2 text-xs" style={{ color: GOLD }}>CTA: {data.aiCopy.cta}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ActionButton href="/design-templates" accent={GOLD} variant="primary">
            Open Canva
          </ActionButton>
          <ActionButton href="/dashboard/listings" accent={GOLD} variant="secondary">
            Save Design
          </ActionButton>
        </div>
      </PremiumCard>

      <PremiumCard accent={GOLD} style={{ padding: 28, borderRadius: 18 }}>
        <AiActionCenter
          hubType="luxury"
          recommendations={recommendations}
          theme={theme}
          performanceSummary="Luxury hub: premium listings and high-end marketing."
        />
      </PremiumCard>

      <PremiumCard accent={GOLD} style={{ padding: 28, borderRadius: 18 }}>
        <h2 className="text-xl font-semibold" style={{ color: GOLD }}>Top 3 opportunities</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {data.top3.map((item) => (
            <div key={item.projectId} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Rank #{item.rank}</p>
              <p className="mt-1 text-sm text-slate-300">{item.reason}</p>
              <p className="mt-2 text-sm" style={{ color: GOLD }}>Score {item.score}/100</p>
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}
