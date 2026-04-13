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

type AppliedRow = {
  id: string;
  fieldType: string;
  proposedValue: string | null;
  reason: string | null;
  riskLevel: string;
  updatedAt: string;
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
  const [recentApplied, setRecentApplied] = useState<AppliedRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/autopilot/listings/${encodeURIComponent(listingId)}/suggestions`, {
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (Array.isArray(data.pending)) setPending(data.pending);
        if (Array.isArray(data.recentApplied)) setRecentApplied(data.recentApplied);
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

  const riskLabel = (r: string, auto: boolean, fieldType: string) => {
    if (fieldType === "night_price_cents") return "Requires approval — price not changed automatically";
    if (r === "high") return "Requires approval";
    if (auto) return "Safe to auto-apply";
    return "Suggested fix";
  };

  return (
    <div className="mt-10 rounded-2xl border border-ds-border bg-ds-card p-6 shadow-ds-soft md:p-8">
      <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-ds-text">Listing optimization</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ds-text-secondary">
        Grounded edits only — no invented amenities or legal claims. Price rows are suggestions until you change pricing
        in the editor.
        {qualityScoreBefore != null ? (
          <span className="mt-2 block font-medium text-ds-text">Listing quality score: {qualityScoreBefore}/100.</span>
        ) : null}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={running}
          onClick={() => void runAutopilot()}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-ds-gold px-5 text-sm font-semibold text-ds-bg shadow-ds-glow transition hover:brightness-110 disabled:opacity-60 sm:flex-none"
        >
          {running ? "Working…" : "Run optimization"}
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => void applySafe()}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-ds-border bg-ds-surface px-5 text-sm font-semibold text-ds-text transition hover:border-ds-gold/35 disabled:opacity-60 sm:flex-none"
        >
          Apply safe fixes
        </button>
      </div>
      {message ? <p className="mt-4 text-sm text-ds-text-secondary">{message}</p> : null}

      <div className="mt-8 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ds-text-secondary">Pending suggestions</h3>
        {loading ? <p className="text-sm text-ds-text-secondary">Loading…</p> : null}
        {!loading && pending.length === 0 ? (
          <p className="text-sm text-ds-text-secondary">No open suggestions. Run optimization to generate fixes.</p>
        ) : null}
        <ul className="space-y-4">
          {pending.map((s) => (
            <li key={s.id} className="rounded-xl border border-ds-border bg-ds-surface/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-ds-gold">{labelForField(s.fieldType)}</span>
                  <span className="ml-2 rounded-full border border-ds-border bg-ds-card px-2 py-0.5 text-[11px] font-medium text-ds-text-secondary">
                    {riskLabel(s.riskLevel, s.autoApplyAllowed, s.fieldType)}
                  </span>
                </div>
                <span className="text-[11px] text-ds-text-secondary">Confidence {s.confidenceScore}%</span>
              </div>
              {s.reason ? <p className="mt-2 text-sm leading-relaxed text-ds-text-secondary">{s.reason}</p> : null}
              {s.fieldType === "photo_order" ? (
                <p className="mt-2 font-mono text-[11px] text-ds-text-secondary">Photo order JSON updated (cover first).</p>
              ) : (
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ds-text-secondary">Before</p>
                    <p className="mt-1 whitespace-pre-wrap text-ds-text/90 line-clamp-6">
                      {(s.currentValue ?? "").slice(0, 1200) || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ds-text-secondary">Proposed</p>
                    <p className="mt-1 whitespace-pre-wrap text-ds-text line-clamp-6">
                      {(s.proposedValue ?? "").slice(0, 1200) || "—"}
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ds-border pt-4">
                <button
                  type="button"
                  onClick={() => void approve(s.id)}
                  className="rounded-lg bg-ds-gold px-4 py-2 text-xs font-semibold text-ds-bg hover:brightness-110"
                >
                  {s.fieldType === "night_price_cents" ? "Approve (audit only)" : "Approve & apply"}
                </button>
                <button
                  type="button"
                  onClick={() => void reject(s.id)}
                  className="rounded-lg border border-ds-border px-4 py-2 text-xs font-semibold text-ds-text-secondary hover:border-ds-gold/35 hover:text-ds-text"
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {recentApplied.length > 0 ? (
        <div className="mt-10 border-t border-ds-border pt-8">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ds-text-secondary">Recently applied</h3>
          <ul className="mt-3 space-y-2 text-xs text-ds-text-secondary">
            {recentApplied.map((a) => (
              <li key={a.id}>
                <span className="font-medium text-ds-text">{labelForField(a.fieldType)}</span>
                <span className="text-ds-text-secondary/70"> · {new Date(a.updatedAt).toLocaleString()}</span>
                {a.reason ? <span className="block text-ds-text-secondary/90">{a.reason}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
