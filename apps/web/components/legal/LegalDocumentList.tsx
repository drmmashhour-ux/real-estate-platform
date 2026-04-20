"use client";

import { useCallback, useEffect, useState } from "react";

export type LegalSubmissionDocRow = {
  id: string;
  workflowType: string;
  requirementId: string;
  actorType: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  status: string;
  uploadedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

type Props = {
  enabled: boolean;
  workflowTypeFilter?: string | null;
  refreshToken?: number;
};

export function LegalDocumentList({ enabled, workflowTypeFilter, refreshToken }: Props) {
  const [docs, setDocs] = useState<LegalSubmissionDocRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const qs =
        workflowTypeFilter && workflowTypeFilter.trim()
          ? `?workflowType=${encodeURIComponent(workflowTypeFilter.trim())}`
          : "";
      const res = await fetch(`/api/legal/documents${qs}`, { method: "GET", credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        documents?: LegalSubmissionDocRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not load documents.");
        setDocs([]);
        return;
      }
      setDocs(Array.isArray(data.documents) ? data.documents : []);
    } catch {
      setError("Could not load documents.");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, workflowTypeFilter]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Your submission documents</h3>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs font-medium text-premium-gold hover:underline"
        >
          Refresh
        </button>
      </div>
      {loading ? <p className="mt-3 text-xs text-[#9CA3AF]">Loading…</p> : null}
      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
      {!loading && docs.length === 0 ? (
        <p className="mt-3 text-xs text-[#9CA3AF]">No uploads yet for this filter.</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {docs.map((d) => (
          <li
            key={d.id}
            className="rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-xs text-[#D1D5DB]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-white">{d.fileName}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-premium-gold">
                {d.status}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#9CA3AF]">
              Workflow {d.workflowType} · item {d.requirementId}
            </p>
            {d.rejectionReason ? (
              <p className="mt-2 text-[11px] text-amber-200/90">
                Operator note: {d.rejectionReason}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
