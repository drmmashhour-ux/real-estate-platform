"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ActionRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  actionType: string;
  priority: string;
  status: string;
  reasonText: string | null;
  ownerType: string | null;
  estimatedTimelineBand: string | null;
  estimatedCostBand: string | null;
  estimatedEffortBand: string | null;
};

type Bundle = {
  listingId: string;
  summary: {
    compositeScore: number | null;
    grade: string | null;
    dataCoveragePercent: number | null;
    evidenceConfidence: number | null;
    acquisitionReadinessBand: string;
    totalOpenActions: number;
  };
  actions: ActionRow[];
  quickWins: ActionRow[];
  strategicActions: ActionRow[];
  blockers: ActionRow[];
  completedActions: ActionRow[];
  potentialUplift: {
    narrative: string;
    scoreBandHint: string;
    confidenceBandHint: string;
    disclaimer: string;
  };
};

function badgePri(p: string) {
  if (p === "CRITICAL") return "bg-rose-500/25 text-rose-100";
  if (p === "HIGH") return "bg-amber-500/25 text-amber-100";
  if (p === "MEDIUM") return "bg-sky-500/20 text-sky-100";
  return "bg-slate-600/30 text-slate-200";
}

function ActionCard({
  a,
  onStatus,
}: {
  a: ActionRow;
  onStatus: (id: string, status: string, note?: string) => void | Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badgePri(a.priority)}`}>
            {a.priority}
          </span>
          <h4 className="mt-2 font-semibold text-white">{a.title}</h4>
          <p className="mt-1 text-xs text-slate-400">{a.description.slice(0, 220)}</p>
          {a.reasonText ? <p className="mt-2 text-xs text-slate-500">Why: {a.reasonText}</p> : null}
        </div>
        <div className="text-right text-[11px] text-slate-500">
          <p>Owner: {a.ownerType ?? "—"}</p>
          <p>Timeline: {a.estimatedTimelineBand ?? "—"}</p>
          <p>Cost: {a.estimatedCostBand ?? "—"}</p>
          <p>Effort: {a.estimatedEffortBand ?? "—"}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/15"
          onClick={() => onStatus(a.id, "IN_PROGRESS")}
        >
          Start
        </button>
        <button
          type="button"
          className="rounded-lg bg-emerald-600/40 px-2 py-1 text-[11px] text-emerald-50 hover:bg-emerald-600/60"
          onClick={() => onStatus(a.id, "COMPLETED")}
        >
          Complete
        </button>
        <button
          type="button"
          className="rounded-lg bg-white/5 px-2 py-1 text-[11px] text-slate-400 hover:bg-white/10"
          onClick={() => {
            const note = window.prompt("Brief reason for dismiss (required):") ?? "";
            void onStatus(a.id, "DISMISSED", note);
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function EsgActionCenterAssetClient({ listingId }: { listingId: string }) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [genBusy, setGenBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/esg/action-center/${encodeURIComponent(listingId)}`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as Bundle & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setBundle(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setGenBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/esg/action-center/${encodeURIComponent(listingId)}/generate`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenBusy(false);
    }
  }

  async function onStatus(actionId: string, status: string, note?: string) {
    try {
      const res = await fetch(`/api/esg/action-center/action/${encodeURIComponent(actionId)}/status`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Update failed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (err && !bundle) return <p className="text-sm text-red-400">{err}</p>;
  if (!bundle) return null;

  const hero = bundle.summary;

  return (
    <div className="space-y-10">
      {err ? <p className="text-sm text-amber-300/90">{err}</p> : null}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <Link href="/dashboard/esg/action-center" className="text-premium-gold hover:underline">
              ← Portfolio action center
            </Link>
            <Link
              href={`/dashboard/esg/retrofit/${encodeURIComponent(listingId)}`}
              className="text-premium-gold hover:underline"
            >
              Retrofit planner & financing
            </Link>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Asset ESG actions</h2>
          <p className="mt-1 text-sm text-slate-400">
            Advisory roadmap — scores and uplift are directional bands, not guarantees.
          </p>
        </div>
        <button
          type="button"
          disabled={genBusy}
          onClick={() => void generate()}
          className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:opacity-95 disabled:opacity-40"
        >
          {genBusy ? "Generating…" : "Generate / refresh actions"}
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 md:col-span-2">
          <p className="text-xs uppercase text-slate-500">ESG composite</p>
          <p className="mt-1 text-3xl font-bold text-white">{hero.compositeScore ?? "—"}</p>
          <p className="text-sm text-emerald-200">Grade {hero.grade ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-xs uppercase text-slate-500">Data coverage</p>
          <p className="mt-1 text-2xl font-semibold text-white">{hero.dataCoveragePercent ?? "—"}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-xs uppercase text-slate-500">Evidence confidence</p>
          <p className="mt-1 text-2xl font-semibold text-white">{hero.evidenceConfidence ?? "—"}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
        <h3 className="text-sm font-semibold text-white">Readiness & uplift (directional)</h3>
        <p className="mt-2 text-sm text-slate-300">
          Acquisition readiness band: <strong className="text-white">{hero.acquisitionReadinessBand}</strong> · Open
          actions: {hero.totalOpenActions}
        </p>
        <p className="mt-3 text-sm text-slate-400">{bundle.potentialUplift.narrative}</p>
        <p className="mt-2 text-sm text-slate-400">{bundle.potentialUplift.scoreBandHint}</p>
        <p className="mt-1 text-sm text-slate-400">{bundle.potentialUplift.confidenceBandHint}</p>
        <p className="mt-3 text-xs text-slate-600">{bundle.potentialUplift.disclaimer}</p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-white">Priority actions</h3>
        <div className="mt-4 grid gap-4">
          {bundle.actions.slice(0, 12).map((a) => (
            <ActionCard key={a.id} a={a} onStatus={(id, st, n) => void onStatus(id, st, n)} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-emerald-200">Quick wins</h3>
          <div className="mt-3 space-y-3">
            {bundle.quickWins.map((a) => (
              <ActionCard key={a.id} a={a} onStatus={(id, st, n) => void onStatus(id, st, n)} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-200">Strategic / capex</h3>
          <div className="mt-3 space-y-3">
            {bundle.strategicActions.map((a) => (
              <ActionCard key={a.id} a={a} onStatus={(id, st, n) => void onStatus(id, st, n)} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-500/20 bg-rose-950/15 p-6">
        <h3 className="text-sm font-semibold text-rose-100">Blockers & dependencies</h3>
        <div className="mt-4 space-y-3">
          {bundle.blockers.length === 0 ?
            <p className="text-sm text-slate-500">No critical documentation blockers flagged.</p>
          : bundle.blockers.map((a) => (
              <ActionCard key={a.id} a={a} onStatus={(id, st, n) => void onStatus(id, st, n)} />
            ))
          }
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-300">Completed</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          {bundle.completedActions.length === 0 ?
            <li>None yet.</li>
          : bundle.completedActions.map((a) => (
              <li key={a.id}>
                <span className="text-slate-200">{a.title}</span> · {a.status}
              </li>
            ))
          }
        </ul>
      </section>
    </div>
  );
}
