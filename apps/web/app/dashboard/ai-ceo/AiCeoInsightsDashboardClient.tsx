"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type InsightBlock = {
  title: string;
  summary: string;
  reasoning: string;
  signals: { id: string; label: string; value: string | number | boolean | null; source: string }[];
};

type AlertRow = {
  type: string;
  severity: string;
  title: string;
  message: string;
  reasoning: string;
  signals: InsightBlock["signals"];
};

type PriorityRow = {
  title: string;
  summary: string;
  executionSafety: string;
  explanation?: { whyItMatters?: string; confidenceRationale?: string };
};

type ApiPayload = {
  success?: boolean;
  summary?: string;
  topPriorities?: PriorityRow[];
  alerts?: AlertRow[];
  keyInsights?: string[];
  risks?: InsightBlock[];
  opportunities?: InsightBlock[];
  recommendations?: InsightBlock[];
  contextMeta?: { thinDataWarnings?: string[]; generatedAt?: string };
  error?: string;
};

export function AiCeoInsightsDashboardClient() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/ai-ceo/insights", { credentials: "include" });
      const j = (await r.json()) as ApiPayload;
      setData(j);
    } catch {
      setData({ error: "fetch_failed" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading strategic insights…</p>;
  }

  if (!data?.success) {
    return (
      <Card className="border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
        {data?.error === "insights_failed" ? "Unable to build insights." : null}
        {data?.error === "fetch_failed" ? "Network error." : null}
        {!data?.error ? "Unauthorized or unavailable." : null}
        <div className="mt-3">
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const warns = data.contextMeta?.thinDataWarnings ?? [];

  return (
    <div className="space-y-6">
      {warns.length > 0 && (
        <Card className="border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100">
          <p className="font-medium text-amber-200">Data coverage</p>
          <ul className="mt-2 list-inside list-disc text-amber-100/90">
            {warns.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 italic">Executive summary</h2>
        <Link 
          href="/dashboard/defensibility" 
          className="text-[10px] font-black uppercase tracking-widest text-premium-gold hover:text-amber-200 transition-colors flex items-center gap-2"
        >
          View Defensibility Moat <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
        <p className="text-sm leading-relaxed text-zinc-200">{data.summary}</p>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-amber-200/90">Top 3 priorities</h2>
          <ul className="mt-3 space-y-4">
            {(data.topPriorities ?? []).map((p, i) => (
              <li key={p.title} className="text-sm">
                <span className="font-medium text-zinc-100">
                  {i + 1}. {p.title}
                </span>
                <p className="mt-1 text-zinc-400">{p.summary}</p>
                <p className="mt-1 text-xs text-zinc-500">Safety: {p.executionSafety}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-red-300/90">Alerts</h2>
          {(data.alerts ?? []).length === 0 ?
            <p className="mt-3 text-sm text-zinc-500">No rule-based alerts at this snapshot.</p>
          : <ul className="mt-3 space-y-3">
              {(data.alerts ?? []).map((a) => (
                <li key={a.title + a.type} className="rounded-lg border border-zinc-800/80 bg-black/20 p-3 text-sm">
                  <span className="text-xs uppercase text-zinc-500">
                    {a.severity} · {a.type}
                  </span>
                  <p className="mt-1 font-medium text-zinc-100">{a.title}</p>
                  <p className="mt-1 text-zinc-400">{a.message}</p>
                  <p className="mt-2 text-xs text-zinc-500">{a.reasoning}</p>
                </li>
              ))}
            </ul>
          }
        </Card>
      </div>

      <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold text-zinc-300">Key insights</h2>
        <ul className="mt-3 list-inside list-decimal space-y-2 text-sm text-zinc-300">
          {(data.keyInsights ?? []).map((k) => (
            <li key={k.slice(0, 80)}>{k}</li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <InsightList title="Risks" items={data.risks ?? []} accent="text-red-300/90" />
        <InsightList title="Opportunities" items={data.opportunities ?? []} accent="text-emerald-300/90" />
      </div>

      <InsightList title="Recommended actions (ranked)" items={data.recommendations ?? []} accent="text-amber-200/80" />

      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
    </div>
  );
}

function InsightList({
  title,
  items,
  accent,
}: {
  title: string;
  items: InsightBlock[];
  accent: string;
}) {
  return (
    <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
      <h2 className={`text-sm font-semibold ${accent}`}>{title}</h2>
      {items.length === 0 ?
        <p className="mt-3 text-sm text-zinc-500">None in this window.</p>
      : <ul className="mt-3 space-y-4">
          {items.map((it) => (
            <li key={it.title} className="text-sm">
              <p className="font-medium text-zinc-100">{it.title}</p>
              <p className="mt-1 text-zinc-400">{it.summary}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{it.reasoning}</p>
              {it.signals.length > 0 && (
                <ul className="mt-2 space-y-1 border-l border-zinc-700 pl-3 text-xs text-zinc-500">
                  {it.signals.map((s) => (
                    <li key={s.id}>
                      <span className="text-zinc-400">{s.label}:</span> {String(s.value)}{" "}
                      <span className="text-zinc-600">({s.source})</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      }
    </Card>
  );
}
