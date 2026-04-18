"use client";

import { useCallback, useEffect, useState } from "react";

type Suggestion = {
  id: string;
  suggestionType: string;
  title: string;
  summary: string;
  severity: string;
  status: string;
  confidence: number;
};

type Props = {
  dealId: string;
  canMutate: boolean;
  enabled: boolean;
  onError: (msg: string | null) => void;
};

export function DealCopilotPanel({ dealId, canMutate, enabled, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [workflow, setWorkflow] = useState<{ packageKey: string; disclaimer: string } | null>(null);

  const load = useCallback(async () => {
    onError(null);
    const res = await fetch(`/api/deals/${dealId}/copilot`);
    const data = await res.json();
    if (!res.ok) {
      onError(data.error ?? "Failed to load copilot");
      return;
    }
    setSuggestions(data.suggestions ?? []);
    if (data.workflowHint) {
      setWorkflow({
        packageKey: data.workflowHint.packageKey,
        disclaimer: data.workflowHint.disclaimer,
      });
    }
  }, [dealId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runEngine() {
    if (!canMutate) return;
    setLoading(true);
    onError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/copilot/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Run failed");
      await load();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setLoading(false);
    }
  }

  async function resolve(id: string, action: "approve" | "reject") {
    if (!canMutate) return;
    onError(null);
    const res = await fetch(`/api/deals/${dealId}/copilot/suggestions/${id}/${action}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      onError(data.error ?? "Action failed");
      return;
    }
    await load();
  }

  if (!enabled) {
    return (
      <section className="rounded-2xl border border-zinc-700 bg-zinc-900/50 p-6 text-sm text-zinc-500">
        Deal execution copilot is disabled. Set <code className="text-amber-600/90">FEATURE_DEAL_EXECUTION_COPILOT_V1=1</code>{" "}
        to enable broker assistance for this environment.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-950/30 to-black/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl tracking-tight text-amber-50">Deal execution copilot</h2>
          <p className="mt-1 max-w-2xl text-sm text-amber-100/70">
            Suggested workflow package is assistance only — confirm against OACIQ and your brokerage.
          </p>
          {workflow && (
            <p className="mt-3 text-xs leading-relaxed text-amber-200/80">
              <span className="font-semibold text-amber-400">Suggested package:</span> {workflow.packageKey}
              <br />
              <span className="text-amber-100/60">{workflow.disclaimer}</span>
            </p>
          )}
        </div>
        {canMutate ? (
          <button
            type="button"
            onClick={() => void runEngine()}
            disabled={loading}
            className="rounded-xl bg-amber-500/90 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Running…" : "Run analysis"}
          </button>
        ) : (
          <p className="text-xs text-zinc-500">Only the assigned broker or admin can run or resolve suggestions.</p>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        {suggestions.length === 0 ? (
          <li className="text-sm text-zinc-500">No copilot rows yet. Run analysis after enabling contract intelligence flags.</li>
        ) : (
          suggestions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-200"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/90">{s.severity}</span>
                <span className="text-[10px] uppercase text-zinc-500">{s.suggestionType}</span>
                <span className="text-[10px] text-zinc-600">{s.status}</span>
              </div>
              <p className="mt-1 font-medium text-amber-50">{s.title}</p>
              <p className="mt-1 text-zinc-400">{s.summary}</p>
              {canMutate && s.status === "pending" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-950/50"
                    onClick={() => void resolve(s.id, "approve")}
                  >
                    Mark reviewed (approve log)
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-600 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-900"
                    onClick={() => void resolve(s.id, "reject")}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
