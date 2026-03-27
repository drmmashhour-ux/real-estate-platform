"use client";

import { useCallback, useEffect, useState } from "react";
import type { NegotiationPlaybookPublicDto } from "@/modules/deal-analyzer/domain/contracts";
import { MarketConditionBadge } from "@/components/deal/MarketConditionBadge";

type Props = {
  listingId: string;
  enabled: boolean;
};

export function NegotiationPlaybookCard({ listingId, enabled }: Props) {
  const [dto, setDto] = useState<NegotiationPlaybookPublicDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/negotiation-playbook`, {
      credentials: "include",
    });
    if (res.status === 503) return;
    if (!res.ok) return;
    const j = (await res.json()) as { negotiationPlaybook?: NegotiationPlaybookPublicDto | null };
    setDto(j.negotiationPlaybook ?? null);
  }, [listingId]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/negotiation-playbook/run`, {
        method: "POST",
        credentials: "include",
      });
      const j = (await res.json()) as { negotiationPlaybook?: NegotiationPlaybookPublicDto | null; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not generate playbook");
        return;
      }
      setDto(j.negotiationPlaybook ?? null);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Negotiation playbook</p>
        {dto ? <MarketConditionBadge marketCondition={dto.marketCondition} /> : null}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Illustrative steps from market signals — not legal advice. Keep standard protections unless you accept added
        risk knowingly.
      </p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="mt-4 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate / refresh playbook"}
      </button>
      {err ? <p className="mt-2 text-xs text-red-300">{err}</p> : null}
      {dto ? (
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Confidence:</span>{" "}
            <span className="text-amber-200/90">{dto.confidenceLevel}</span>
            {" · "}
            <span className="text-slate-500">Posture:</span>{" "}
            <span className="text-white">{dto.posture.replace(/_/g, " ")}</span>
          </p>
          <ol className="list-decimal space-y-2 pl-4 text-xs text-slate-400">
            {dto.playbookSteps.map((s, i) => (
              <li key={`${i}-${s.step.slice(0, 24)}`}>
                <span className="font-medium text-slate-200">{s.step}</span>
                <span className="block text-slate-500">{s.rationale}</span>
              </li>
            ))}
          </ol>
          {dto.warnings.length > 0 ? (
            <ul className="list-inside list-disc text-xs text-amber-200/75">
              {dto.warnings.map((w) => (
                <li key={w.slice(0, 48)}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Run after Phase 2 comparables for best context.</p>
      )}
    </div>
  );
}
