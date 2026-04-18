"use client";

import { useCallback, useEffect, useState } from "react";
import { FounderPriorityPanel } from "./FounderPriorityPanel";
import { FounderInsightFeed } from "./FounderInsightFeed";
import { FounderQuestionBox } from "./FounderQuestionBox";
import { FounderActionBoard } from "./FounderActionBoard";
import { FounderMetricSnapshot } from "./FounderMetricSnapshot";
import type { CompanyInsight } from "@/modules/company-insights/company-insights.types";
import type { FounderIntelligenceSnapshot } from "@/modules/founder-intelligence/founder-intelligence.types";
import type { FounderCopilotRunResult } from "@/modules/founder-copilot/founder-copilot.types";

type CopilotApiResponse = {
  disclaimer?: string;
  intelligence: FounderIntelligenceSnapshot;
  insights: CompanyInsight[];
  copilot: FounderCopilotRunResult;
  analytics?: unknown;
};

export function FounderCopilotWorkspace() {
  const [data, setData] = useState<CopilotApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/founder/copilot?window=30d", { credentials: "include" });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? res.statusText);
      }
      const json = (await res.json()) as CopilotApiResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Chargement du copilote fondateur…</p>;
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <p className="text-xs text-zinc-500">{data.disclaimer}</p>
      <FounderMetricSnapshot snapshot={data.intelligence.current} />
      <div className="grid gap-6 lg:grid-cols-2">
        <FounderPriorityPanel snapshot={data.intelligence} copilot={data.copilot} />
        <FounderInsightFeed insights={data.insights} />
      </div>
      <FounderQuestionBox
        onAnswered={() => {
          void load();
        }}
      />
      <FounderActionBoard />
    </div>
  );
}
