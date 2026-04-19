"use client";

import * as React from "react";
import type { BrokerLeadRoutingDecision } from "@/modules/broker/distribution/broker-lead-distribution.types";

function confidenceClass(c: string): string {
  if (c === "high") return "bg-emerald-500/15 text-emerald-100 border-emerald-500/35";
  if (c === "medium") return "bg-sky-500/15 text-sky-100 border-sky-500/35";
  if (c === "insufficient") return "bg-slate-500/15 text-slate-300 border-slate-500/35";
  return "bg-amber-500/15 text-amber-100 border-amber-500/35";
}

export function BrokerLeadRoutingPanel({
  leadId,
  leadSummary,
}: {
  leadId: string;
  /** Short lead header — does not expose full message if absent */
  leadSummary?: { name?: string; city?: string; score?: number };
}) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [decision, setDecision] = React.useState<BrokerLeadRoutingDecision | null>(null);
  const [disclaimer, setDisclaimer] = React.useState<string | null>(null);
  const [overrideNote, setOverrideNote] = React.useState("");
  const [manualBrokerId, setManualBrokerId] = React.useState("");
  const [assigning, setAssigning] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/distribution`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as {
        decision?: BrokerLeadRoutingDecision;
        disclaimer?: string;
        error?: string;
      };
      if (res.status === 404) {
        setErr("Lead distribution is disabled or unavailable.");
        setDecision(null);
        return;
      }
      if (!res.ok) {
        setErr(j.error ?? "Failed to load");
        setDecision(null);
        return;
      }
      setDecision(j.decision ?? null);
      setDisclaimer(j.disclaimer ?? null);
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

  const assign = async (brokerId: string) => {
    setAssigning(brokerId);
    try {
      const rec = decision?.recommendedBrokerId;
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/distribution/assign`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brokerId,
          recommendedBrokerId: rec ?? null,
          overrideNote: overrideNote.trim() || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(typeof j.error === "string" ? j.error : "Assignment failed");
        return;
      }
      setOverrideNote("");
      await load();
      alert("Introducing broker updated — timeline event recorded.");
    } finally {
      setAssigning(null);
    }
  };

  if (loading) {
    return (
      <section className="mb-8 rounded-xl border border-cyan-500/25 bg-cyan-950/15 p-4 text-sm text-slate-400">
        Loading lead distribution…
      </section>
    );
  }
  if (err || !decision) {
    return err ? (
      <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-500">{err}</section>
    ) : null;
  }

  return (
    <section className="mb-8 rounded-xl border border-cyan-500/35 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(11,11,11,0.94))] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/90">Internal</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Lead distribution</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Recommendation-first marketplace routing — explicit assignment only; does not send external messages or modify lead
            copy.
          </p>
          {disclaimer ? <p className="mt-2 text-[11px] text-slate-500">{disclaimer}</p> : null}
        </div>
      </div>

      {leadSummary ? (
        <div className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-black/25 p-3 text-xs sm:grid-cols-3">
          <div>
            <span className="text-slate-500">Lead</span>
            <p className="font-medium text-slate-200">{leadSummary.name ?? leadId.slice(0, 8)}…</p>
          </div>
          <div>
            <span className="text-slate-500">City / region hint</span>
            <p className="font-medium text-slate-200">{leadSummary.city ?? "—"}</p>
          </div>
          <div>
            <span className="text-slate-500">Score</span>
            <p className="font-medium text-slate-200">{leadSummary.score ?? "—"}</p>
          </div>
        </div>
      ) : null}

      {decision.selectedBrokerId ? (
        <p className="mt-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300">
          Current introducing broker: <span className="font-mono text-slate-100">{decision.selectedBrokerId}</span> (
          {decision.decisionMode})
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">No introducing broker set — assignment is optional.</p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-slate-400">{decision.explanation}</p>

      {decision.sparseDataNotes.length > 0 ? (
        <ul className="mt-2 space-y-1 text-[11px] text-amber-200/90">
          {decision.sparseDataNotes.map((n, i) => (
            <li key={i}>• {n}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top recommendations</p>
        {decision.candidateRows.length === 0 ? (
          <p className="text-sm text-slate-500">No candidates passed fairness filters — assign manually below.</p>
        ) : (
          <ul className="space-y-3">
            {decision.candidateRows.map((c) => (
              <li key={c.brokerId} className="rounded-lg border border-white/10 bg-black/35 p-3 text-xs text-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-white">{c.displayName}</span>
                  <span className="tabular-nums text-slate-100">{c.routingScore}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${confidenceClass(c.confidenceLevel)}`}
                  >
                    {c.confidenceLevel}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
                  {c.reasons.slice(0, 8).map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
                {c.geoHints ? (
                  <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-950/15 px-3 py-2 text-[11px] text-amber-100/90">
                    <p className="font-semibold text-amber-200/95">Location &amp; fit</p>
                    <ul className="mt-1 space-y-0.5">
                      <li>
                        <span aria-hidden>📍</span>{" "}
                        {c.geoHints.matchType === "none"
                          ? "No strong city match — soft fallback (still in pool)"
                          : c.geoHints.explanation}
                      </li>
                      {c.geoHints.matchType !== "none" ? (
                        <li>
                          <span aria-hidden>🗺</span> Match type: {c.geoHints.matchType.replace(/_/g, " ")} (weight
                          capped)
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}
                {c.strengths.some((s) => s.toLowerCase().includes("load")) ||
                c.reasons.some((s) => s.toLowerCase().includes("load balancing")) ? (
                  <p className="mt-2 text-[11px] text-slate-400">
                    <span aria-hidden>⚖️</span> Balanced workload / fairness signals applied alongside fit.
                  </p>
                ) : null}
                {c.routingAvailability ? (
                  <div className="mt-3 rounded-lg border border-fuchsia-500/20 bg-fuchsia-950/15 px-3 py-2 text-[11px] text-fuchsia-100/90">
                    <p className="font-semibold text-fuchsia-200/95">Availability · capacity · SLA</p>
                    <ul className="mt-1 space-y-0.5">
                      <li>
                        Availability:{" "}
                        <span className="capitalize text-fuchsia-100">{c.routingAvailability.availabilityStatus}</span>
                      </li>
                      <li>
                        Capacity score:{" "}
                        <span className="tabular-nums text-fuchsia-50">{c.routingAvailability.capacityScore}</span> · band
                        inferred from routing snapshot
                      </li>
                      <li>
                        SLA health:{" "}
                        <span className="capitalize">{c.routingAvailability.slaHealth.replace(/_/g, " ")}</span>
                      </li>
                      <li className="text-fuchsia-200/85">
                        Routing adjustment (soft):{" "}
                        <span className="tabular-nums">{c.routingAvailability.routingAdjustment}</span>
                      </li>
                      {c.routingAvailability.reasons.slice(0, 4).map((line, ri) => (
                        <li key={ri}>• {line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {c.profileHints ? (
                  <div className="mt-3 rounded-lg border border-cyan-500/15 bg-cyan-950/20 px-3 py-2 text-[11px] text-cyan-100/90">
                    <p className="font-semibold text-cyan-200/95">Profile signals</p>
                    <ul className="mt-1 space-y-0.5">
                      {c.profileHints.serviceAreaMatch ? (
                        <li>
                          • <span className="text-slate-400">Service area:</span> {c.profileHints.serviceAreaMatch}
                        </li>
                      ) : null}
                      {c.profileHints.specializationMatch ? (
                        <li>
                          <span aria-hidden>🏢</span>{" "}
                          <span className="text-slate-400">Specialization:</span> {c.profileHints.specializationMatch}
                        </li>
                      ) : null}
                      {c.profileHints.languageMatch ? (
                        <li>
                          <span aria-hidden>🌍</span>{" "}
                          <span className="text-slate-400">Language:</span> overlap with lead locale hint
                        </li>
                      ) : null}
                      {c.profileHints.capacityAvailabilityFit ? (
                        <li>
                          • <span className="text-slate-400">Capacity:</span> accepting new leads with lighter active load
                          (hint)
                        </li>
                      ) : null}
                      {c.profileHints.capacityNote ? (
                        <li>
                          • <span className="text-slate-400">Capacity:</span> {c.profileHints.capacityNote}
                        </li>
                      ) : null}
                      {c.profileHints.observedSupportNote ? (
                        <li>
                          • <span className="text-slate-400">Observed (advisory):</span>{" "}
                          {c.profileHints.observedSupportNote}
                        </li>
                      ) : null}
                      {c.profileHints.profileConfidenceNote ? (
                        <li className="text-amber-100/85">
                          • <span className="text-slate-500">Profile data:</span> {c.profileHints.profileConfidenceNote}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}
                {c.strengths.length ? (
                  <p className="mt-2 text-[11px] text-emerald-200/85">
                    <span className="font-semibold text-emerald-300">Strengths:</span> {c.strengths.join(" · ")}
                  </p>
                ) : null}
                {c.risks.length ? (
                  <p className="mt-2 text-[11px] text-amber-200/80">
                    <span className="font-semibold text-amber-300">Risks / notes:</span> {c.risks.join(" · ")}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(assigning)}
                    className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-medium text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"
                    onClick={() => void assign(c.brokerId)}
                  >
                    {assigning === c.brokerId ? "Assigning…" : "Assign to this broker"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-white/15 bg-black/25 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Manual override</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Pick another broker ID when the recommendation does not fit policy — audit trail stores recommended vs actual.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="min-w-[200px] flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-slate-600"
            placeholder="Broker user ID"
            value={manualBrokerId}
            onChange={(e) => setManualBrokerId(e.target.value)}
          />
          <button
            type="button"
            disabled={Boolean(assigning) || !manualBrokerId.trim()}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-40"
            onClick={() => void assign(manualBrokerId.trim())}
          >
            Assign broker ID
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:bg-white/5"
            onClick={() => void load()}
          >
            Re-run recommendation
          </button>
        </div>
        <textarea
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600"
          placeholder="Optional override note (stored on timeline)"
          rows={2}
          value={overrideNote}
          onChange={(e) => setOverrideNote(e.target.value)}
        />
      </div>

      <p className="mt-4 text-[10px] text-slate-600">
        Generated {new Date(decision.createdAt).toLocaleString()}
        {decision.suppressedBrokerIds?.length
          ? ` · ${decision.suppressedBrokerIds.length} broker(s) held back from top list (see fairness penalties).`
          : ""}
      </p>
    </section>
  );
}
