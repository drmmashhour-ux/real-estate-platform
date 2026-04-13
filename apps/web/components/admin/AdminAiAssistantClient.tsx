"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { AdminAiInsight, AdminAiRun } from "@prisma/client";

/** JSON-serialized rows from the server (dates as ISO strings). */
type InsightRow = Omit<AdminAiInsight, "createdAt"> & { createdAt: string };
type RunRow = Omit<AdminAiRun, "createdAt" | "startedAt" | "completedAt"> & {
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

const PRIORITY_RING: Record<string, string> = {
  critical: "border-red-500/50 bg-red-500/10",
  high: "border-amber-500/45 bg-amber-500/10",
  medium: "border-sky-500/35 bg-sky-500/5",
  low: "border-slate-700 bg-slate-900/40",
};

type Props = {
  initialInsights: InsightRow[];
  initialRuns: RunRow[];
  canMutate: boolean;
};

function mdLite(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const t = line.trim();
    if (t.startsWith("**") && t.endsWith("**")) {
      return (
        <p key={i} className="mt-3 font-semibold text-white first:mt-0">
          {t.slice(2, -2)}
        </p>
      );
    }
    if (t.startsWith("- ")) {
      return (
        <li key={i} className="ml-4 list-disc text-slate-300">
          {t.slice(2)}
        </li>
      );
    }
    return (
      <p key={i} className="text-slate-300">
        {line}
      </p>
    );
  });
}

export function AdminAiAssistantClient({ initialInsights, initialRuns, canMutate }: Props) {
  const [insights, setInsights] = useState(initialInsights);
  const [runs, setRuns] = useState(initialRuns);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [links, setLinks] = useState<{ label: string; href: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todaySummary = useMemo(
    () => insights.find((i) => i.type === "daily_summary"),
    [insights]
  );

  const byType = useMemo(() => {
    const g = {
      alert: [] as InsightRow[],
      recommendation: [] as InsightRow[],
      listing_diagnosis: [] as InsightRow[],
      user_intent_summary: [] as InsightRow[],
      revenue_summary: [] as InsightRow[],
      daily_summary: [] as InsightRow[],
    };
    for (const i of insights) {
      if (i.type in g) {
        (g as Record<string, InsightRow[]>)[i.type].push(i);
      }
    }
    return g;
  }, [insights]);

  const refresh = useCallback(async () => {
    const [ir, rr] = await Promise.all([
      fetch("/api/admin-ai/insights?limit=80").then((r) => r.json()),
      fetch("/api/admin-ai/runs").then((r) => r.json()),
    ]);
    if (ir.insights) setInsights(ir.insights);
    if (rr.runs) setRuns(rr.runs);
  }, []);

  const onAsk = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Query failed");
      setAnswer(data.answer);
      setLinks(data.entities ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setAnswer(null);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const onRun = async () => {
    if (!canMutate) return;
    setRunLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runType: "full_daily" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Run failed");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">LECIPM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">AI admin assistant</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Summaries, alerts, and recommendations grounded in live platform signals. No auto-actions — review and
            decide.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-amber-500/40"
          >
            ← Dashboard
          </Link>
          {canMutate ? (
            <button
              type="button"
              onClick={onRun}
              disabled={runLoading}
              className="rounded-lg border border-amber-500/50 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/25 disabled:opacity-50"
            >
              {runLoading ? "Running…" : "Run intelligence now"}
            </button>
          ) : (
            <span className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-500">
              Full admin role required to generate insights
            </span>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white">Today&apos;s summary</h2>
        {todaySummary ? (
          <article className="mt-4 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-slate-900/90 to-slate-950 p-6">
            <p className="text-xs uppercase tracking-wide text-amber-400/90">{todaySummary.title}</p>
            <div className="prose prose-invert mt-3 max-w-none text-sm">{mdLite(todaySummary.body)}</div>
          </article>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            No daily summary yet. Use &quot;Run intelligence now&quot; (admin) to generate insights.
          </p>
        )}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Priority alerts</h2>
          <ul className="mt-4 space-y-3">
            {byType.alert.slice(0, 12).map((a) => (
              <li
                key={a.id}
                className={`rounded-xl border p-4 ${PRIORITY_RING[a.priority] ?? PRIORITY_RING.medium}`}
              >
                <p className="font-medium text-white">{a.title}</p>
                <p className="mt-1 text-sm text-slate-300">{a.body}</p>
                <MetaLinks meta={a.metadataJson} entityId={a.entityId} />
              </li>
            ))}
            {byType.alert.length === 0 && (
              <li className="text-sm text-slate-500">No alert insights stored yet.</li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Recommended actions</h2>
          <ul className="mt-4 space-y-3">
            {byType.recommendation.slice(0, 14).map((a) => (
              <li key={a.id} className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                <p className="font-medium text-emerald-100">{a.title}</p>
                <p className="mt-1 text-sm text-slate-300">{a.body}</p>
                <MetaLinks meta={a.metadataJson} entityId={a.entityId} />
              </li>
            ))}
            {byType.recommendation.length === 0 && (
              <li className="text-sm text-slate-500">No recommendations yet.</li>
            )}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Smart diagnostics</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <DiagColumn title="Listing diagnoses" items={byType.listing_diagnosis} />
          <DiagColumn title="User intent" items={byType.user_intent_summary} />
          <DiagColumn title="Revenue" items={byType.revenue_summary} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Ask AI (signals-grounded)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Answers use aggregated platform signals only — nothing is invented. For deep dives, open linked admin tools.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Which listings waste traffic?"
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600"
          />
          <button
            type="button"
            onClick={onAsk}
            disabled={loading || !q.trim()}
            className="rounded-xl bg-amber-500/90 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {[
            "Which listings are wasting traffic?",
            "What drove revenue this week?",
            "Where is the funnel leaking?",
            "Which sellers need OACIQ document support?",
          ].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQ(s)}
              className="rounded-full border border-slate-700 px-3 py-1 text-slate-400 hover:border-amber-500/40 hover:text-amber-200"
            >
              {s}
            </button>
          ))}
        </div>
        {answer && (
          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-200">
            <p className="whitespace-pre-wrap">{answer}</p>
            {links.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-amber-400 hover:text-amber-300">
                      {l.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Insight history &amp; runs</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Recent insights</p>
            <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto text-sm">
              {insights.slice(0, 25).map((i) => (
                <li key={i.id} className="flex justify-between gap-2 border-b border-slate-800/80 py-2 text-slate-400">
                  <span className="truncate text-slate-300">{i.title}</span>
                  <span className="shrink-0 text-[10px] uppercase text-slate-600">{i.type}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Runs</p>
            <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto text-sm">
              {runs.map((r) => (
                <li key={r.id} className="rounded-lg border border-slate-800 px-3 py-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-mono text-xs text-slate-300">{r.runType}</span>
                    <span className="text-[10px] uppercase text-slate-500">{r.status}</span>
                  </div>
                  {r.summary && <p className="mt-1 text-xs text-slate-500">{r.summary}</p>}
                  <p className="text-[10px] text-slate-600">
                    {r.createdAt.toString().slice(0, 19).replace("T", " ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function DiagColumn({ title, items }: { title: string; items: InsightRow[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <ul className="mt-3 space-y-3 text-sm">
        {items.slice(0, 6).map((i) => (
          <li key={i.id} className="border-b border-slate-800/60 pb-2">
            <p className="text-slate-200">{i.title}</p>
            <p className="mt-1 line-clamp-4 text-xs text-slate-400">{i.body}</p>
            <MetaLinks meta={i.metadataJson} entityId={i.entityId} />
          </li>
        ))}
        {items.length === 0 && <li className="text-slate-500">—</li>}
      </ul>
    </div>
  );
}

function MetaLinks({
  meta,
  entityId,
}: {
  meta: unknown;
  entityId: string | null;
}) {
  const href =
    typeof meta === "object" && meta && "href" in meta && typeof (meta as { href: string }).href === "string"
      ? (meta as { href: string }).href
      : null;
  if (href) {
    return (
      <Link href={href} className="mt-2 inline-block text-xs text-amber-400 hover:text-amber-300">
        Open in admin →
      </Link>
    );
  }
  if (entityId) {
    return (
      <p className="mt-2 text-[10px] text-slate-600">Ref: {entityId.slice(0, 12)}…</p>
    );
  }
  return null;
}
