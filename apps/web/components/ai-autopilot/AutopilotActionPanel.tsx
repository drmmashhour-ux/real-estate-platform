"use client";

import { useCallback, useEffect, useState } from "react";
import type { AutopilotPlanContext } from "@/modules/ai-autopilot-layer/types";
import { AUTOPILOT_DISCLAIMER_FR } from "@/modules/ai-autopilot-layer/types";
import { AutopilotModeSelector } from "./AutopilotModeSelector";
import { AutopilotGuardWarning } from "./AutopilotGuardWarning";

type ActionRow = {
  id: string;
  actionKey: string;
  actionType: string;
  status: string;
  riskLevel: string;
  reasonFr: string | null;
  blockReason: string | null;
  requiresApproval: boolean;
  createdAt: string;
};

export function AutopilotActionPanel({
  draftId,
  dealId,
  planContext,
  showModeSelector = true,
  title = "AI Autopilot — LECIPM",
}: {
  draftId?: string;
  dealId?: string;
  planContext?: AutopilotPlanContext;
  showModeSelector?: boolean;
  title?: string;
}) {
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  const qs = new URLSearchParams();
  if (draftId) qs.set("draftId", draftId);
  if (dealId) qs.set("dealId", dealId);

  const loadActions = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/ai-autopilot/actions?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load actions");
      setActions(data.actions ?? []);
      const cr = await fetch("/api/ai-autopilot/config");
      const cj = await cr.json();
      if (cr.ok) setMode(cj.config?.mode ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [draftId, dealId]);

  useEffect(() => {
    void loadActions();
  }, [loadActions]);

  const runPlan = async () => {
    if (!planContext) {
      setErr("Contexte de planification indisponible pour cette vue.");
      return;
    }
    setPlanning(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai-autopilot/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: planContext, persist: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Plan failed");
      await loadActions();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setPlanning(false);
    }
  };

  const approve = async (id: string) => {
    const res = await fetch("/api/ai-autopilot/approve-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId: id }),
    });
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error || "Approve failed");
      return;
    }
    await loadActions();
  };

  const reject = async (id: string) => {
    const res = await fetch("/api/ai-autopilot/reject-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId: id }),
    });
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error || "Reject failed");
      return;
    }
    await loadActions();
  };

  const execute = async (id: string) => {
    const res = await fetch("/api/ai-autopilot/execute-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId: id, context: planContext }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Execute blocked");
      return;
    }
    await loadActions();
  };

  const riskClass = (r: string) => {
    if (r === "CRITICAL" || r === "HIGH") return "text-red-300 border-red-500/40 bg-red-950/30";
    if (r === "MEDIUM") return "text-amber-200 border-amber-500/40 bg-amber-950/25";
    return "text-zinc-300 border-white/10 bg-black/40";
  };

  return (
    <section className="rounded-xl border border-[#D4AF37]/35 bg-[#0B0B0B] p-4 text-left shadow-lg shadow-black/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-[#D4AF37]">{title}</h3>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
            Mode: <span className="text-zinc-300">{mode ?? "—"}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadActions()}
          className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-zinc-400 hover:text-white"
        >
          Actualiser
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">{AUTOPILOT_DISCLAIMER_FR}</p>

      {showModeSelector && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <AutopilotModeSelector onChange={(m) => setMode(m)} />
        </div>
      )}

      {planContext && mode !== "OFF" && (
        <button
          type="button"
          disabled={planning || mode === "OFF"}
          onClick={() => runPlan()}
          className="mt-4 w-full rounded-lg bg-[#D4AF37]/15 py-2 text-sm font-medium text-[#D4AF37] ring-1 ring-[#D4AF37]/40 hover:bg-[#D4AF37]/25 disabled:opacity-40"
        >
          {planning ? "Planification…" : "Générer les actions proposées"}
        </button>
      )}

      {mode === "OFF" && (
        <p className="mt-3 text-xs text-zinc-500">Autopilot désactivé — aucune action proposée.</p>
      )}

      {err && (
        <div className="mt-3">
          <AutopilotGuardWarning message={err} />
        </div>
      )}

      <div className="mt-4 space-y-3">
        {loading && <p className="text-xs text-zinc-500">Chargement…</p>}
        {!loading && actions.length === 0 && <p className="text-xs text-zinc-500">Aucune action en file.</p>}
        {actions.map((a) => (
          <article
            key={a.id}
            className={`rounded-lg border px-3 py-2 text-sm ${riskClass(a.riskLevel)}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-white">{a.actionKey.replace(/_/g, " ")}</span>
              <span className="text-[10px] uppercase text-zinc-400">{a.status}</span>
            </div>
            {a.reasonFr && <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-300">{a.reasonFr}</p>}
            {a.blockReason && (
              <p className="mt-2 text-xs text-red-300/90">Blocage: {a.blockReason}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {a.status === "PROPOSED" && (
                <>
                  <button
                    type="button"
                    onClick={() => approve(a.id)}
                    className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200 ring-1 ring-emerald-500/40"
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(a.id)}
                    className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                  >
                    Rejeter
                  </button>
                </>
              )}
              {(a.status === "APPROVED" || (a.status === "PROPOSED" && !a.requiresApproval)) &&
                a.status !== "BLOCKED" && (
                  <button
                    type="button"
                    onClick={() => execute(a.id)}
                    className="rounded-md bg-[#D4AF37]/20 px-2 py-1 text-xs text-[#D4AF37] ring-1 ring-[#D4AF37]/40"
                  >
                    Exécuter (préparation sûre)
                  </button>
                )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
