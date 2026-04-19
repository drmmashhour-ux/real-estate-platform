"use client";

import * as React from "react";
import type { GrowthAutonomyLearningSnapshot } from "@/modules/growth/growth-autonomy-learning.types";

export function GrowthAutonomyLearningPanel({
  learning,
  viewerIsAdmin,
  killSwitch,
  debugMode,
}: {
  learning: GrowthAutonomyLearningSnapshot | null | undefined;
  viewerIsAdmin: boolean;
  killSwitch: boolean;
  debugMode: boolean;
}) {
  const [controlMsg, setControlMsg] = React.useState<string | null>(null);

  if (!learning?.enabled) return null;

  async function postControl(action: "reset_weights" | "freeze" | "unfreeze") {
    setControlMsg(null);
    try {
      const r = await fetch("/api/growth/autonomy/learning/control", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!r.ok) throw new Error("Control failed");
      setControlMsg(action === "reset_weights" ? "Weights reset." : action === "freeze" ? "Learning frozen." : "Learning unfrozen.");
    } catch {
      setControlMsg("Control request failed.");
    }
  }

  const entries = Object.entries(learning.effectiveness ?? {}).sort((a, b) => {
    const na = a[1].numericScore ?? -1;
    const nb = b[1].numericScore ?? -1;
    return nb - na;
  });

  const top = entries.slice(0, 3);
  const weak = entries.filter(([, v]) => v.band === "weak" || v.band === "poor").slice(0, 3);

  return (
    <section className="rounded-lg border border-violet-900/40 bg-violet-950/15 px-3 py-2.5" aria-label="Growth autonomy learning">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-300">Autonomy learning (bounded)</p>
        <span className="text-[10px] text-zinc-500">
          Adaptive influence:{" "}
          {killSwitch ?
            <span className="text-red-300">off (kill switch)</span>
          : learning.adaptiveInfluenceActive ?
            <span className="text-emerald-300">on</span>
          : (
            <span className="text-amber-200">off (frozen or disabled)</span>
          )}
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-zinc-500">
        Ordering and soft visibility only — does not execute actions, bypass policy, or widen domains.
      </p>

      <dl className="mt-2 grid gap-1 text-[10px] text-zinc-400 sm:grid-cols-3">
        <div>
          <dt className="text-zinc-600">Adjusted categories</dt>
          <dd className="font-medium text-zinc-200">{learning.categoriesAdjusted}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Suppressed (soft)</dt>
          <dd className="font-medium text-zinc-200">{learning.categoriesSuppressed}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Insufficient data</dt>
          <dd className="font-medium text-zinc-200">{learning.sparseDataCategories}</dd>
        </div>
      </dl>

      {top.length > 0 ? (
        <div className="mt-2 border-t border-zinc-800 pt-2">
          <p className="text-[10px] font-semibold text-zinc-500">Stronger signals</p>
          <ul className="mt-1 space-y-1 text-[11px] text-zinc-300">
            {top.map(([cat, eff]) => (
              <li key={cat}>
                <span className="font-medium text-zinc-200">{cat}</span> — {eff.band}
                {eff.numericScore !== undefined ? ` (${eff.numericScore.toFixed(2)})` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {weak.length > 0 ? (
        <div className="mt-2 border-t border-zinc-800 pt-2">
          <p className="text-[10px] font-semibold text-zinc-500">Weaker signals</p>
          <ul className="mt-1 space-y-1 text-[11px] text-zinc-400">
            {weak.map(([cat]) => (
              <li key={cat}>{learning.explanations?.[cat as keyof NonNullable<typeof learning.explanations>] ?? cat}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {viewerIsAdmin ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-800 pt-2">
          <button
            type="button"
            className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900"
            onClick={() => void postControl("reset_weights")}
          >
            Reset learned weights
          </button>
          <button
            type="button"
            className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900"
            onClick={() => void postControl("freeze")}
          >
            Freeze learning
          </button>
          <button
            type="button"
            className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900"
            onClick={() => void postControl("unfreeze")}
          >
            Unfreeze
          </button>
          {controlMsg ? <span className="text-[10px] text-emerald-400">{controlMsg}</span> : null}
        </div>
      ) : null}

      {debugMode ? (
        <div className="mt-2 rounded border border-dashed border-zinc-700/80 bg-black/20 p-2 font-mono text-[9px] text-zinc-500">
          <p>Learning module: on</p>
          <p>Adaptive influence: {String(learning.adaptiveInfluenceActive)}</p>
          <p>Last cycle: {learning.lastLearningRunAt ?? "—"}</p>
          <p>
            Adjusted categories: {learning.categoriesAdjusted} · Soft-suppressed: {learning.categoriesSuppressed} · Sparse
            data: {learning.sparseDataCategories}
          </p>
          <p>
            Frozen: {String(learning.control?.frozen ?? false)}
            {learning.control?.lastFreezeAt ? ` (at ${learning.control.lastFreezeAt})` : ""}
          </p>
          <p>Last manual reset: {learning.control?.lastManualResetAt ?? "—"}</p>
        </div>
      ) : null}
    </section>
  );
}
