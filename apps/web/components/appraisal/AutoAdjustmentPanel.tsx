"use client";

import { useCallback, useEffect, useState } from "react";

type Proposal = {
  id: string;
  label: string;
  direction: string;
  suggestedAmountCents: number;
  rationale: string | null;
  confidence: number | null;
  sourceType: string | null;
  reviewed: boolean;
  approved: boolean;
};

export default function AutoAdjustmentPanel({
  appraisalCaseId,
  comparableId,
  onRefresh,
  className = "",
}: {
  appraisalCaseId: string;
  comparableId: string;
  onRefresh?: () => void;
  className?: string;
}) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromServer = useCallback(async () => {
    const params = new URLSearchParams({ appraisalCaseId, comparableId });
    const res = await fetch(`/api/appraisal/auto-adjustments?${params}`);
    const data = (await res.json()) as { proposals?: Proposal[]; error?: string };
    if (res.ok && data.proposals) {
      setProposals(data.proposals);
    }
    onRefresh?.();
  }, [appraisalCaseId, comparableId, onRefresh]);

  useEffect(() => {
    void loadFromServer();
  }, [loadFromServer]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/appraisal/auto-adjustments/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appraisalCaseId, comparableId }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        result?: { aiSummary?: string | null; warnings?: string[] };
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Generate failed");
        return;
      }
      setSummary(json.result?.aiSummary ?? null);
      setWarnings(json.result?.warnings ?? []);
      await loadFromServer();
    } finally {
      setLoading(false);
    }
  }

  async function approve(proposalId: string) {
    const res = await fetch("/api/appraisal/auto-adjustments/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId }),
    });
    if (res.ok) {
      await loadFromServer();
    }
  }

  async function reject(proposalId: string) {
    const res = await fetch("/api/appraisal/auto-adjustments/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId }),
    });
    if (res.ok) {
      await loadFromServer();
    }
  }

  return (
    <div
      className={`space-y-4 rounded-2xl border border-white/10 bg-gradient-to-b from-black/70 to-black/40 p-4 text-white ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-serif text-lg font-semibold text-[#D4AF37]">AI & rule adjustments</div>
          <p className="mt-0.5 text-xs text-white/55">
            Proposals only — broker approval applies ledger-style adjustments to this comparable.
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="shrink-0 rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate proposals"}
        </button>
      </div>

      {error ? (
        <p className="text-xs text-red-300/90" role="alert">
          {error}
        </p>
      ) : null}

      {summary ? (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">AI summary</div>
          <p className="mt-1 text-sm text-white/80">{summary}</p>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/25 p-3">
          <div className="text-xs font-medium text-amber-200/90">Warnings</div>
          <ul className="mt-1 list-disc pl-4 text-xs text-amber-100/85">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
        {proposals.length === 0 ? (
          <p className="text-xs text-white/45">No proposals yet. Generate to feed the valuation layer.</p>
        ) : (
          proposals.map((proposal) => (
            <div key={proposal.id} className="rounded-xl border border-white/10 bg-black/35 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-[#D4AF37]">{proposal.label}</div>
                <div className="shrink-0 text-right text-xs text-white/65">
                  {proposal.direction} ${(proposal.suggestedAmountCents / 100).toLocaleString()}
                </div>
              </div>
              {proposal.rationale ? (
                <p className="mt-1 text-xs text-white/65">{proposal.rationale}</p>
              ) : null}
              <div className="mt-2 text-[10px] text-white/40">
                {proposal.confidence != null ? `Confidence ${proposal.confidence.toFixed(2)} · ` : null}
                {proposal.sourceType ?? "—"}
                {proposal.reviewed ? (proposal.approved ? " · Approved" : " · Rejected") : ""}
              </div>
              {!proposal.reviewed ? (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => approve(proposal.id)}
                    className="rounded-md bg-[#D4AF37] px-2 py-1 text-xs font-semibold text-black"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(proposal.id)}
                    className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/85"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
