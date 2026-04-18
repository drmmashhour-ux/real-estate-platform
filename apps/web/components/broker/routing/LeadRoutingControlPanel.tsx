"use client";

import * as React from "react";
import type { LeadRoutingDecision } from "@/modules/broker/routing/broker-routing-v2.types";

export function LeadRoutingControlPanel({ leadId }: { leadId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [decision, setDecision] = React.useState<LeadRoutingDecision | null>(null);
  const [existingIntroducerId, setExistingIntroducerId] = React.useState<string | null>(null);
  const [autoHint, setAutoHint] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/routing/v2`, {
        credentials: "same-origin",
      });
      if (res.status === 404) {
        setErr("Routing V2 is not enabled or no candidate is available.");
        setDecision(null);
        return;
      }
      const j = (await res.json()) as {
        decision?: LeadRoutingDecision;
        existingIntroducerId?: string | null;
        autoEligibleHint?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "Failed to load routing decision");
        setDecision(null);
        return;
      }
      setDecision(j.decision ?? null);
      setExistingIntroducerId(j.existingIntroducerId ?? null);
      setAutoHint(Boolean(j.autoEligibleHint));
    } catch {
      setErr("Network error");
      setDecision(null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const postAssign = async (action: "approve" | "reject" | "auto") => {
    setBusy(action);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/routing/v2/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; detail?: string; status?: string };
      if (!res.ok) {
        setNotice(j.error ?? "Request failed");
        return;
      }
      setNotice(
        typeof j.detail === "string" ? j.detail : action === "reject" ? "Dismissed." : "Done.",
      );
      await load();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lecipm:lead-routing-updated", { detail: { leadId } }));
      }
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <section className="mb-8 rounded-xl border border-cyan-500/20 bg-cyan-950/15 p-4 text-sm text-slate-400">
        Loading routing decision…
      </section>
    );
  }
  if (err || !decision) {
    return err ? (
      <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-500">{err}</section>
    ) : null;
  }

  return (
    <section className="mb-8 rounded-xl border border-cyan-500/35 bg-[linear-gradient(135deg,rgba(6,182,212,0.12),rgba(11,11,11,0.92))] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/90">Admin</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Smart routing V2 (semi-automatic)</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Suggested match from V1 ranking — assignment is optional and policy-controlled. Brokers are never blocked from
            normal CRM access.
          </p>
        </div>
      </div>

      {existingIntroducerId ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/25 px-3 py-2 text-xs text-amber-100">
          This lead already has an introducing broker. Approve will reassign to the selected broker (use with care).
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-black/30 p-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase text-slate-500">Recommended broker</p>
          <p className="font-medium text-white">
            {decision.recommendedBrokerName ?? decision.recommendedBrokerId.slice(0, 8)}…
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-slate-500">Confidence</p>
          <p className="font-semibold text-cyan-200">{decision.confidenceScore}/100</p>
          <p className="text-[11px] text-slate-500">
            {decision.requiresApproval ? "Requires approval before auto-style assignment." : "Meets confidence threshold."}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-slate-400">
        {decision.rationale.map((r, i) => (
          <li key={`${i}-${r.slice(0, 40)}`} className="list-inside list-disc">
            {r}
          </li>
        ))}
      </ul>

      {notice ? <p className="mt-3 text-sm text-cyan-200/90">{notice}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy != null}
          onClick={() => void postAssign("approve")}
          className="rounded-lg border border-cyan-500/50 bg-cyan-950/40 px-4 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-950/60 disabled:opacity-50"
        >
          {busy === "approve" ? "Applying…" : "Approve assignment"}
        </button>
        <button
          type="button"
          disabled={busy != null}
          onClick={() => void postAssign("reject")}
          className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-white/30 disabled:opacity-50"
        >
          {busy === "reject" ? "…" : "Reject suggestion"}
        </button>
        {autoHint ? (
          <button
            type="button"
            disabled={busy != null}
            onClick={() => void postAssign("auto")}
            className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-950/50 disabled:opacity-50"
          >
            {busy === "auto" ? "Running…" : "Run gated auto-assign"}
          </button>
        ) : (
          <span className="self-center text-[11px] text-slate-500">
            Auto-assign requires feature flag + policy + high confidence + no introducer.
          </span>
        )}
      </div>
    </section>
  );
}
