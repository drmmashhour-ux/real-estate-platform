"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ManagerPayload = {
  assetHealth?: {
    overallHealthScore?: number;
    healthBand?: string;
    explanation?: string;
    confidence?: string;
    assetName?: string;
    blockers?: string[];
    opportunities?: string[];
    subscores?: Record<string, { score?: number }>;
  };
  strategy?: {
    strategyType?: string;
    rationale?: string[];
    pendingPlans?: Array<{ id: string; version?: string; status?: string; summaryText?: string | null }>;
  };
  actions?: Array<{
    id: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    expectedImpactBand?: string | null;
    costBand?: string | null;
    timelineBand?: string | null;
    ownerType?: string | null;
    explanation?: string | null;
    planId?: string | null;
  }>;
  outcomeHistory?: Array<{
    id: string;
    eventType: string;
    outcomeCategory?: string | null;
    note?: string | null;
    createdAt: string;
  }>;
  error?: string;
};

export function PortfolioAssetDetailClient({ assetId }: { assetId: string }) {
  const [data, setData] = useState<ManagerPayload | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/portfolio/assets/${encodeURIComponent(assetId)}/manager`, {
        credentials: "include",
      });
      const j = (await res.json()) as ManagerPayload;
      if (!res.ok) throw new Error(j.error ?? "Failed to load");
      setData(j);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Unable to load asset.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runPlan() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/portfolio/assets/${encodeURIComponent(assetId)}/manager/run`, {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Run failed");
      setMsg(
        `Generated plan · actions: ${typeof j.actionCount === "number" ? j.actionCount : "—"} · strategy: ${String(j.strategy?.strategyType ?? "—")}`,
      );
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  async function approve(planId: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/portfolio/assets/${encodeURIComponent(assetId)}/manager/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Approve failed");
      setMsg("Plan approved.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function reject(planId: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/portfolio/assets/${encodeURIComponent(assetId)}/manager/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Reject failed");
      setMsg("Plan rejected.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading asset workspace…</p>;
  }

  if (msg && !data) {
    return <p className="text-sm text-destructive">{msg}</p>;
  }

  const h = data?.assetHealth;
  const strat = data?.strategy;

  return (
    <div className="space-y-10">
      {msg ?
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{msg}</p>
      : null}

      {!data ?
        <p className="text-sm text-muted-foreground">Loading…</p>
      : null}

      {data ?
        <>
          <section className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Health summary</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Asset</dt>
                <dd className="font-medium">{h?.assetName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Band</dt>
                <dd className="font-medium">{h?.healthBand ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Overall score</dt>
                <dd className="font-medium tabular-nums">
                  {h?.overallHealthScore != null ? h.overallHealthScore.toFixed(1) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Confidence</dt>
                <dd className="font-medium">{h?.confidence ?? "—"}</dd>
              </div>
            </dl>
            {h?.explanation ?
              <p className="mt-3 text-sm text-muted-foreground">{h.explanation}</p>
            : null}
            {h?.blockers && h.blockers.length > 0 ?
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase text-destructive">Blockers</p>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {h.blockers.slice(0, 8).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            : null}
          </section>

          <section className="rounded-xl border p-4">
            <h2 className="text-lg font-semibold">Recommended strategy</h2>
            <p className="mt-2 text-sm font-medium">{strat?.strategyType ?? "—"}</p>
            {strat?.rationale?.length ?
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                {strat.rationale.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => void runPlan()}>
                {busy ? "Working…" : "Generate / refresh plan"}
              </Button>
            </div>
            {strat?.pendingPlans?.length ?
              <ul className="mt-4 space-y-3">
                {strat.pendingPlans.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">{p.version}</span> · {p.status}
                      {p.summaryText ?
                        <p className="mt-1 text-muted-foreground">{p.summaryText.slice(0, 240)}</p>
                      : null}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void approve(p.id)}>
                        Approve
                      </Button>
                      <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void reject(p.id)}>
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            : null}
          </section>

          <section className="rounded-xl border p-4">
            <h2 className="text-lg font-semibold">Ranked actions</h2>
            <ul className="mt-3 divide-y rounded-lg border">
              {(data.actions ?? []).map((a) => (
                <li key={a.id} className="p-3 text-sm">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.category} · {a.priority} · {a.status}
                    {a.costBand ? ` · ${a.costBand}` : ""}
                    {a.timelineBand ? ` · ${a.timelineBand}` : ""}
                  </div>
                  {a.explanation ?
                    <p className="mt-1 text-muted-foreground">{a.explanation}</p>
                  : null}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border p-4">
            <h2 className="text-lg font-semibold">Outcome history</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(data.outcomeHistory ?? []).slice(0, 15).map((o) => (
                <li key={o.id} className="rounded-md border border-dashed px-3 py-2">
                  <span className="font-medium">{o.eventType}</span>
                  {o.outcomeCategory ?
                    <span className="ml-2 text-muted-foreground">({o.outcomeCategory})</span>
                  : null}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()}
                  </span>
                  {o.note ?
                    <p className="mt-1 text-muted-foreground">{o.note}</p>
                  : null}
                </li>
              ))}
            </ul>
          </section>
        </>
      : null}
    </div>
  );
}
