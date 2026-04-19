"use client";

import * as React from "react";
import type { InvestorDashboard } from "@/modules/investors/investor-dashboard.types";
import { InvestorSharePanel } from "./InvestorSharePanel";

export function InvestorDashboardPanel({ sharePanelEnabled = false }: { sharePanelEnabled?: boolean }) {
  const [data, setData] = React.useState<{ dashboard: InvestorDashboard; disclaimer?: string } | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    void fetch("/api/investors/dashboard?windowDays=14", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as {
          dashboard: InvestorDashboard;
          disclaimer?: string;
          error?: string;
        };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        setData(j);
        setErr(null);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const copyText = React.useCallback((label: string, body: string) => {
    void navigator.clipboard.writeText(body).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  const fullReportText = React.useMemo(() => {
    if (!data) return "";
    const { dashboard } = data;
    const blocks = [
      `# Investor dashboard`,
      `Generated ${dashboard.generatedAt}`,
      "",
      "## Meta",
      `Sparse bundle: ${dashboard.meta.sparseBundle}`,
      `Missing areas: ${dashboard.meta.missingDataAreas.join("; ") || "none"}`,
      "",
      "## Metrics",
      ...dashboard.metrics.map((m) => `- ${m.label}: ${m.value} (${m.period}, confidence ${m.confidence})`),
      "",
      "## Narrative",
      dashboard.narrative.headline,
      "",
      dashboard.narrative.summary,
      "",
      "### Growth",
      ...dashboard.narrative.growthStory.map((l) => `- ${l}`),
      "",
      "### Execution proof",
      ...dashboard.narrative.executionProof.map((l) => `- ${l}`),
      "",
      "### Expansion",
      ...dashboard.narrative.expansionStory.map((l) => `- ${l}`),
      "",
      "### Risks",
      ...dashboard.narrative.risks.map((l) => `- ${l}`),
      "",
      "### Outlook",
      ...dashboard.narrative.outlook.map((l) => `- ${l}`),
      "",
      "## Sections",
      ...dashboard.sections.map((s) => `### ${s.title}\n${s.content}`),
      "",
      data.disclaimer ?? "",
    ];
    return blocks.join("\n");
  }, [data]);

  if (err) {
    return (
      <section className="rounded-xl border border-amber-900/45 bg-amber-950/15 p-4">
        <h3 className="text-lg font-semibold text-zinc-100">Investor dashboard</h3>
        <p className="mt-2 text-sm text-amber-200/90">{err}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs text-zinc-500">Loading investor dashboard…</p>
      </section>
    );
  }

  const { dashboard } = data;
  const n = dashboard.narrative;

  return (
    <section
      id="growth-mc-investor-dashboard"
      className="scroll-mt-24 rounded-xl border border-indigo-900/50 bg-indigo-950/15 p-4"
      data-growth-investor-dashboard-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300/90">
            Investor-ready snapshot
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Investor dashboard</h3>
          <p className="mt-1 max-w-2xl text-[11px] text-zinc-500">
            Auto-built from CRM + Growth Machine signals. {dashboard.meta.sparseBundle ? "Treat as directional — sparse bundle." : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-indigo-700 bg-indigo-950/40 px-2 py-1 text-xs text-indigo-100 hover:bg-indigo-900/50"
            onClick={() => copyText("summary", `${n.headline}\n\n${n.summary}`)}
          >
            {copied === "summary" ? "Copied" : "Copy summary"}
          </button>
          <button
            type="button"
            className="rounded-md border border-indigo-700 bg-indigo-950/40 px-2 py-1 text-xs text-indigo-100 hover:bg-indigo-900/50"
            onClick={() => copyText("full", fullReportText)}
          >
            {copied === "full" ? "Copied" : "Copy full report"}
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
            onClick={() =>
              copyText(
                "json",
                JSON.stringify({ dashboard, disclaimer: data.disclaimer }, null, 2),
              )
            }
          >
            {copied === "json" ? "Copied" : "Copy JSON"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dashboard.metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-zinc-800 bg-black/25 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{m.value}</p>
            {m.change ? <p className="text-xs text-zinc-500">{m.change}</p> : null}
            <p className="mt-2 text-[10px] text-zinc-600">
              {m.period} · confidence <span className="text-indigo-300/90">{m.confidence}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-indigo-200/90">Growth narrative</h4>
          <p className="mt-1 text-base font-medium text-zinc-100">{n.headline}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{n.summary}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
            {n.growthStory.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-emerald-200/85">Execution proof</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
              {n.executionProof.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-sky-200/85">Expansion strategy</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
              {n.expansionStory.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-amber-900/45 bg-amber-950/20 p-3">
          <h4 className="text-sm font-semibold text-amber-200/95">Risks & warnings</h4>
          <ul className="mt-2 space-y-1 text-sm text-amber-100/85">
            {n.risks.map((line) => (
              <li key={line}>• {line}</li>
            ))}
            {dashboard.meta.warnings.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
          {dashboard.meta.missingDataAreas.length ? (
            <p className="mt-2 text-[11px] text-amber-200/80">
              Gaps: {dashboard.meta.missingDataAreas.join("; ")}
            </p>
          ) : null}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-zinc-300">Outlook</h4>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
            {n.outlook.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-[10px] leading-snug text-zinc-600">{data.disclaimer}</p>

      {sharePanelEnabled ? <InvestorSharePanel /> : null}

      <button type="button" className="mt-2 text-xs text-indigo-400 hover:underline" onClick={() => load()}>
        Refresh
      </button>
    </section>
  );
}
