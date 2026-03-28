"use client";

import { useCallback, useEffect, useState } from "react";

type QueueItem = {
  id: string;
  entityType: string;
  entityId: string;
  priority: number;
  reasonSummary: string;
  status: string;
  assignedAdminId: string | null;
  createdAt: string;
  risk: { riskScore: number; riskLevel: string } | null;
};

type FlagRow = {
  id: string;
  entityType: string;
  entityId: string;
  flagType: string;
  severity: string;
  status: string;
  createdAt: string;
  detailsJson: unknown;
};

type FlagDetail = {
  flag: FlagRow;
  score: { riskScore: number; riskLevel: string; evidenceJson: unknown } | null;
  snapshot: Record<string, unknown> | null;
  hostSummary: { hostId: string; score: number | null } | null;
};

export function FraudDashboardClient() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [qStatus, setQStatus] = useState("pending");
  const [qEntity, setQEntity] = useState("");
  const [fStatus, setFStatus] = useState("open");
  const [fEntity, setFEntity] = useState("");
  const [fSeverity, setFSeverity] = useState("");
  const [detail, setDetail] = useState<FlagDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    const p = new URLSearchParams();
    p.set("status", qStatus);
    if (qEntity) p.set("entityType", qEntity);
    const res = await fetch(`/api/admin/fraud/queue?${p}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Queue load failed");
    setQueue(data.items);
  }, [qStatus, qEntity]);

  const loadFlags = useCallback(async () => {
    const p = new URLSearchParams();
    p.set("status", fStatus);
    if (fEntity) p.set("entityType", fEntity);
    if (fSeverity) p.set("severity", fSeverity);
    const res = await fetch(`/api/admin/fraud/flags?${p}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Flags load failed");
    setFlags(data.flags);
  }, [fStatus, fEntity, fSeverity]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadQueue(), loadFlags()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [loadQueue, loadFlags]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function openFlag(id: string) {
    const res = await fetch(`/api/admin/fraud/flags/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Detail failed");
      return;
    }
    setDetail(data as FlagDetail);
  }

  async function resolveFlag(action: string) {
    if (!detail) return;
    const res = await fetch(`/api/admin/fraud/flags/${detail.flag.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes: "" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Resolve failed");
      return;
    }
    setDetail(null);
    await refresh();
  }

  async function recompute() {
    setLoading(true);
    const res = await fetch("/api/admin/fraud/recompute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "all", limit: 25 }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Recompute failed");
      return;
    }
    await refresh();
  }

  async function claimQueue(id: string) {
    const res = await fetch(`/api/admin/fraud/queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_review" }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Update failed");
      return;
    }
    await refresh();
  }

  return (
    <section className="mt-10 space-y-6 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">LECIPM fraud queue & flags</h2>
          <p className="text-sm text-slate-500">
            Internal moderation only — no guest-facing fraud accusations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void recompute()}
          disabled={loading}
          className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          Recompute (batch)
        </button>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-slate-300">Queue</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <select
              value={qStatus}
              onChange={(e) => setQStatus(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
            >
              <option value="pending">pending</option>
              <option value="in_review">in_review</option>
              <option value="resolved">resolved</option>
              <option value="all">all</option>
            </select>
            <select
              value={qEntity}
              onChange={(e) => setQEntity(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
            >
              <option value="">all types</option>
              <option value="listing">listing</option>
              <option value="review">review</option>
              <option value="host">host</option>
            </select>
          </div>
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
            {queue.map((q) => (
              <li
                key={q.id}
                className="rounded border border-slate-800 bg-slate-950/80 p-2 text-slate-300"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-mono text-xs text-amber-200/90">
                    {q.entityType} · {q.entityId.slice(0, 12)}…
                  </span>
                  <span className="text-xs text-slate-500">P{q.priority}</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  risk: {q.risk?.riskLevel ?? "—"} ({q.risk ? q.risk.riskScore.toFixed(2) : "—"})
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{q.reasonSummary}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void claimQueue(q.id)}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    Mark in review
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-300">Open flags</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <select
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
            >
              <option value="open">open</option>
              <option value="reviewed">reviewed</option>
              <option value="dismissed">dismissed</option>
              <option value="confirmed">confirmed</option>
              <option value="all">all</option>
            </select>
            <select
              value={fEntity}
              onChange={(e) => setFEntity(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
            >
              <option value="">all types</option>
              <option value="listing">listing</option>
              <option value="review">review</option>
            </select>
            <select
              value={fSeverity}
              onChange={(e) => setFSeverity(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
            >
              <option value="">all severity</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </div>
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
            {flags.map((f) => (
              <li key={f.id} className="rounded border border-slate-800 bg-slate-950/80 p-2">
                <button
                  type="button"
                  onClick={() => void openFlag(f.id)}
                  className="w-full text-left text-slate-300 hover:text-white"
                >
                  <span className="font-mono text-xs text-cyan-200/90">{f.flagType}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {f.entityType} · {f.severity}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {detail ? (
        <div className="rounded border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
          <h4 className="font-medium text-white">Flag detail</h4>
          <pre className="mt-2 max-h-48 overflow-auto rounded bg-black/40 p-2 text-xs text-slate-400">
            {JSON.stringify(
              {
                flag: detail.flag,
                aggregateScore: detail.score,
                snapshot: detail.snapshot,
                host: detail.hostSummary,
              },
              null,
              2
            )}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void resolveFlag("reviewed")}
              className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
            >
              Mark reviewed
            </button>
            <button
              type="button"
              onClick={() => void resolveFlag("dismissed")}
              className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => void resolveFlag("confirmed")}
              className="rounded bg-amber-900 px-2 py-1 text-xs text-amber-100"
            >
              Confirm suspicious
            </button>
            <button
              type="button"
              onClick={() => void resolveFlag("request_verification")}
              className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
            >
              Request manual verification
            </button>
            <button
              type="button"
              onClick={() => void resolveFlag("trust_review")}
              className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
            >
              Trust review
            </button>
            <button
              type="button"
              onClick={() => void resolveFlag("ranking_penalty_note")}
              className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
            >
              Note internal ranking context
            </button>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="rounded px-2 py-1 text-xs text-slate-500"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
