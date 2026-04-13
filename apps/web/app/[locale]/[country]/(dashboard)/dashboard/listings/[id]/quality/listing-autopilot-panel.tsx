"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Suggestion = {
  id: string;
  fieldType: string;
  currentValue: string | null;
  proposedValue: string | null;
  reason: string | null;
  riskLevel: string;
  confidenceScore: number;
  autoApplyAllowed: boolean;
  status: string;
};

export function ListingAutopilotPanel({
  listingId,
  qualityScoreBefore,
}: {
  listingId: string;
  qualityScoreBefore: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [pending, setPending] = useState<Suggestion[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/autopilot/listings/${encodeURIComponent(listingId)}/suggestions`, {
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.pending)) {
        setPending(data.pending.filter((s: Suggestion) => s.status === "suggested"));
      }
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAutopilot = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/autopilot/listings/${encodeURIComponent(listingId)}/run`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Run failed");
      setMessage("Autopilot run completed. Review suggestions below.");
      await load();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setRunning(false);
    }
  };

  const applySafe = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/autopilot/listings/${encodeURIComponent(listingId)}/apply-safe`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Apply failed");
      setMessage(`Applied ${data.appliedIds?.length ?? 0} safe fix(es).`);
      await load();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setRunning(false);
    }
  };

  const approve = async (id: string) => {
    const res = await fetch(`/api/autopilot/suggestions/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      credentials: "same-origin",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(typeof data.error === "string" ? data.error : "Approve failed");
      return;
    }
    setMessage("Suggestion applied.");
    await load();
    router.refresh();
  };

  const reject = async (id: string) => {
    const res = await fetch(`/api/autopilot/suggestions/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      credentials: "same-origin",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(typeof data.error === "string" ? data.error : "Reject failed");
      return;
    }
    setMessage("Suggestion rejected.");
    await load();
  };

  const labelForField = (ft: string) => {
    switch (ft) {
      case "title":
        return "Title";
      case "description":
        return "Description";
      case "subtitle_cta":
        return "Subtitle / hook";
      case "photo_order":
        return "Photo order";
      case "night_price_cents":
        return "Nightly price (suggestion only)";
      default:
        return ft;
    }
  };

  const riskLabel = (r: string, auto: boolean) => {
    if (r === "high") return "Requires approval";
    if (auto) return "Safe to auto-apply";
    return "Suggested fix";
  };

  return (
    <div className="mt-10 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6">
      <h2 className="text-lg font-semibold text-slate-900">AI optimization (autopilot)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Grounded rewrites only — no invented amenities or legal claims. Price changes are suggestions until you change
        pricing in the editor.
        {qualityScoreBefore != null ? (
          <span className="ml-1 font-medium text-slate-800">Current quality: {qualityScoreBefore}/100.</span>
        ) : null}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={running}
          onClick={() => void runAutopilot()}
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {running ? "Working…" : "Run optimization"}
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => void applySafe()}
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-indigo-300 bg-white px-4 text-sm font-semibold text-indigo-900 hover:bg-indigo-50 disabled:opacity-60"
        >
          Apply all safe fixes
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Pending suggestions</h3>
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {!loading && pending.length === 0 ? (
          <p className="text-sm text-slate-500">No open suggestions. Run optimization to generate fixes.</p>
        ) : null}
        <ul className="space-y-3">
          {pending.map((s) => (
            <li key={s.id} className="rounded-xl border border-white bg-white/90 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    {labelForField(s.fieldType)}
                  </span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {riskLabel(s.riskLevel, s.autoApplyAllowed)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Confidence {s.confidenceScore}%</span>
              </div>
              {s.reason ? <p className="mt-1 text-sm text-slate-600">{s.reason}</p> : null}
              {s.fieldType === "photo_order" ? (
                <p className="mt-2 font-mono text-[11px] text-slate-500">Photo order JSON updated (cover first).</p>
              ) : (
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase text-slate-400">Before</p>
                    <p className="whitespace-pre-wrap text-slate-700 line-clamp-6">
                      {(s.currentValue ?? "").slice(0, 1200) || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase text-slate-400">After</p>
                    <p className="whitespace-pre-wrap text-slate-900 line-clamp-6">
                      {(s.proposedValue ?? "").slice(0, 1200) || "—"}
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void approve(s.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Approve & apply
                </button>
                <button
                  type="button"
                  onClick={() => void reject(s.id)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
