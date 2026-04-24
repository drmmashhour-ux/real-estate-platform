"use client";

import * as React from "react";

type StrategyRow = {
  id: string;
  strategyType: string;
  suggestedPrice: number;
  conditionChangesJson: unknown;
  timelineSuggestion: string;
  reasoningJson: unknown;
  confidenceScore: number;
  workflowStatus: string;
  brokerNotes: string | null;
  createdAt: string;
};

function cad(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function parseReasoning(j: unknown): { summary?: string; bullets?: string[]; riskReward?: { risk: string; reward: string } } {
  if (!j || typeof j !== "object") return {};
  return j as { summary?: string; bullets?: string[]; riskReward?: { risk: string; reward: string } };
}

function parseConditions(j: unknown): Array<{ change: string; detail?: string }> {
  if (!Array.isArray(j)) return [];
  return j.filter((x) => x && typeof x === "object") as Array<{ change: string; detail?: string }>;
}

export function NegotiationStrategyAiPanel({ dealId }: { dealId: string }) {
  const [strategies, setStrategies] = React.useState<StrategyRow[]>([]);
  const [runId, setRunId] = React.useState<string | null>(null);
  const [disclaimer, setDisclaimer] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [priceDrafts, setPriceDrafts] = React.useState<Record<string, string>>({});
  const [notesDrafts, setNotesDrafts] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/negotiation`, { credentials: "include" });
      const data = (await res.json()) as {
        negotiationStrategies?: StrategyRow[];
        strategyRunId?: string | null;
        negotiationAiDisclaimer?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Unable to load negotiation workspace");
      setStrategies(data.negotiationStrategies ?? []);
      setRunId(data.strategyRunId ?? null);
      setDisclaimer(data.negotiationAiDisclaimer ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }, [dealId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/negotiation`, { method: "POST", credentials: "include" });
      const data = (await res.json()) as { ok?: boolean; strategies?: StrategyRow[]; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Generate failed");
      setStrategies(data.strategies ?? []);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }

  async function patchStrategy(
    strategyId: string,
    workflowStatus: "BROKER_SELECTED" | "BROKER_APPROVED_TO_SEND" | "DISMISSED" | "AI_PROPOSED",
  ) {
    setBusy(true);
    setError(null);
    try {
      const priceRaw = priceDrafts[strategyId]?.trim();
      const price = priceRaw ? Number(priceRaw.replace(/[^0-9.-]/g, "")) : undefined;
      const res = await fetch(`/api/deals/${dealId}/negotiation/strategies/${strategyId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowStatus,
          brokerNotes: notesDrafts[strategyId]?.trim() || undefined,
          suggestedPrice: Number.isFinite(price) ? price : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Update failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-ds-border bg-ds-card/40 p-5 shadow-ds-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-medium text-ds-text">Negotiation AI — counter-offer strategies</h2>
          <p className="mt-1 text-xs text-ds-text-secondary">
            Three assistive profiles (aggressive, balanced, safe). Nothing sends automatically.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="rounded-lg border border-ds-gold/40 bg-black/30 px-3 py-2 text-xs font-medium text-ds-gold hover:bg-black/50 disabled:opacity-50"
        >
          {busy ? "Working…" : "Generate / refresh strategies"}
        </button>
      </div>
      {disclaimer ? <p className="text-[11px] leading-relaxed text-amber-100/90">{disclaimer}</p> : null}
      {runId ? <p className="text-[10px] text-ds-text-secondary">Latest run: {runId}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {strategies.length === 0 ? (
        <p className="text-sm text-ds-text-secondary">No AI strategy run yet — generate to preview price, conditions, and timing.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-3">
          {strategies.map((s) => {
            const reasoning = parseReasoning(s.reasoningJson);
            const conds = parseConditions(s.conditionChangesJson);
            const draftPrice = priceDrafts[s.id] ?? String(Math.round(s.suggestedPrice));
            return (
              <li
                key={s.id}
                className="flex flex-col rounded-xl border border-ds-border/80 bg-black/25 p-4 text-sm text-ds-text"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ds-gold">{s.strategyType}</span>
                  <span className="text-[10px] text-ds-text-secondary">{s.workflowStatus.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-2 font-mono text-2xl text-emerald-200">{cad(s.suggestedPrice)}</p>
                <p className="text-[10px] text-ds-text-secondary">Suggested counter (CAD) — edit before approval</p>
                <label className="mt-2 block text-[10px] font-semibold uppercase text-ds-text-secondary">
                  Your price draft
                  <input
                    className="mt-1 w-full rounded border border-ds-border bg-background px-2 py-1 text-xs text-ds-text"
                    value={draftPrice}
                    onChange={(e) => setPriceDrafts((m) => ({ ...m, [s.id]: e.target.value }))}
                  />
                </label>
                <p className="mt-3 text-xs text-ds-text-secondary">{s.timelineSuggestion}</p>
                <ul className="mt-2 space-y-1 text-xs text-ds-text-secondary">
                  {conds.map((c, i) => (
                    <li key={i}>
                      <span className="font-medium text-ds-text">{c.change}</span>
                      {c.detail ? ` — ${c.detail}` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[10px] font-semibold uppercase text-ds-text-secondary">
                  Confidence {Math.round(s.confidenceScore)}%
                </p>
                {reasoning.riskReward ? (
                  <div className="mt-2 space-y-1 text-[11px] text-ds-text-secondary">
                    <p>
                      <span className="font-semibold text-ds-text">Risk:</span> {reasoning.riskReward.risk}
                    </p>
                    <p>
                      <span className="font-semibold text-ds-text">Reward:</span> {reasoning.riskReward.reward}
                    </p>
                  </div>
                ) : null}
                {reasoning.summary ? <p className="mt-2 text-xs text-ds-text">{reasoning.summary}</p> : null}
                {reasoning.bullets && reasoning.bullets.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc text-[11px] text-ds-text-secondary">
                    {reasoning.bullets.slice(0, 4).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : null}
                <label className="mt-3 block text-[10px] font-semibold uppercase text-ds-text-secondary">
                  Broker notes
                  <textarea
                    className="mt-1 w-full rounded border border-ds-border bg-background px-2 py-1 text-xs text-ds-text"
                    rows={2}
                    value={notesDrafts[s.id] ?? s.brokerNotes ?? ""}
                    onChange={(e) => setNotesDrafts((m) => ({ ...m, [s.id]: e.target.value }))}
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded border border-ds-border px-2 py-1 text-[11px] disabled:opacity-50"
                    onClick={() => void patchStrategy(s.id, "BROKER_SELECTED")}
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded border border-ds-gold/50 px-2 py-1 text-[11px] text-ds-gold disabled:opacity-50"
                    onClick={() => void patchStrategy(s.id, "BROKER_APPROVED_TO_SEND")}
                  >
                    Approve for manual send
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded border border-rose-500/40 px-2 py-1 text-[11px] text-rose-200 disabled:opacity-50"
                    onClick={() => void patchStrategy(s.id, "DISMISSED")}
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
