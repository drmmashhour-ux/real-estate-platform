"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart2, Star, Target } from "lucide-react";
import { DAILY_TARGETS, paceToTextClass, WEEKLY_TARGETS } from "@/modules/field/field-kpi.config";
import { getMockFieldAgentKpi, getMockManagerAgents } from "@/modules/field/field-kpi.adapters";
import {
  buildDailyKpiLines,
  buildLeaderboard,
  buildWeeklyKpiLines,
  computeAlerts,
  computeCoaching,
  computeDailyScore,
} from "@/modules/field/field-kpi.engine";
import { FieldKpiProgressBar } from "./FieldKpiProgressBar";
import { cn } from "@/lib/utils";
import Link from "next/link";

function cad(n: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n / 100);
}

export function FieldKpiDashboardClient() {
  const [now, setNow] = useState(() => new Date());
  const input = useMemo(() => getMockFieldAgentKpi(), []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const dailyLines = useMemo(() => buildDailyKpiLines(input), [input]);
  const weeklyLines = useMemo(() => buildWeeklyKpiLines(input), [input]);
  const score = useMemo(() => computeDailyScore(input), [input]);
  const alerts = useMemo(() => computeAlerts(input, now), [input, now]);
  const coaching = useMemo(() => computeCoaching(input, dailyLines), [input, dailyLines]);
  const board = useMemo(
    () => buildLeaderboard([input, ...getMockManagerAgents()]),
    [input],
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Score du jour (pondéré)</p>
          <p className="mt-1 text-3xl font-bold text-white tabular-nums">{score.toFixed(1)}</p>
          <p className="text-xs text-zinc-500">Démos + conversion = poids max</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cibles du jour (référence)</p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-300">
            <li>Appels: {DAILY_TARGETS.calls}</li>
            <li>DM / contacts: {DAILY_TARGETS.dmsOrContacts}</li>
            <li>Démos bookées: {DAILY_TARGETS.demosBooked.min}–{DAILY_TARGETS.demosBooked.max}</li>
            <li>Démos complétées: {DAILY_TARGETS.demosCompleted}</li>
            <li>Suivis: {DAILY_TARGETS.followUps}</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Agrégation (branchement)</p>
          <p className="mt-2 text-xs text-zinc-400">
            Données démo : connecter outreach, agenda démo, et clôture (voir{" "}
            <code className="text-zinc-300">field-kpi.adapters.ts</code>).
          </p>
          <Link href="/admin/kpi" className="mt-2 inline-block text-xs text-amber-400/90 hover:text-amber-300">
            Vue manager →
          </Link>
        </div>
      </div>

      {alerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-rose-300/90">
            <AlertTriangle className="h-4 w-4" /> Alertes
          </h2>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  a.severity === "critical" ? "border-rose-500/40 bg-rose-500/5 text-rose-100" : "border-amber-500/30 bg-amber-500/5 text-amber-100",
                )}
              >
                {a.id === "no_demos_middays" && "⚠️ "}
                {a.id === "low_activity" && "⚠️ "}
                {a.id === "multi_critical" && "⚠️ "}
                {a.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          <Target className="h-4 w-4" /> Cibles aujourd’hui
        </h2>
        <div className="space-y-3">
          {dailyLines.map((l) => (
            <div key={l.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-zinc-200">{l.label}</span>
                <span className={cn("text-xs font-medium", paceToTextClass(l.pace))}>
                  {l.current} / cible {l.targetLabel} ({l.percent.toFixed(0)}%)
                </span>
              </div>
              <FieldKpiProgressBar className="mt-2" percent={l.percent} pace={l.pace} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Cibles de la semaine</h2>
        <p className="mb-2 text-xs text-zinc-500">Référence : {WEEKLY_TARGETS.brokersContacted.min}+ courtiers, démos, essais, activations, payants.</p>
        <div className="space-y-3">
          {weeklyLines.map((l) => (
            <div key={l.id} className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-zinc-300">{l.label}</span>
                <span className={cn("text-xs font-medium", paceToTextClass(l.pace))}>
                  {l.current} / {l.targetLabel} ({l.percent.toFixed(0)}%)
                </span>
              </div>
              <FieldKpiProgressBar className="mt-2" percent={l.percent} pace={l.pace} />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Résumé</h2>
          <dl className="mt-2 space-y-1 text-sm text-zinc-300">
            <div className="flex justify-between">
              <dt>Revenu (démo)</dt>
              <dd className="text-zinc-100">{cad(input.revenueCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Conversions (proxy)</dt>
              <dd className="text-zinc-100">{(input.conversions <= 1 ? input.conversions * 100 : input.conversions).toFixed(1)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt>Essais (jour)</dt>
              <dd className="text-zinc-100">{input.trialsStarted}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-400/80">
            <BarChart2 className="h-4 w-4" /> Coaching
          </h2>
          <p className="mt-2 text-sm text-zinc-200">
            <span className="text-emerald-300/80">Force :</span> {coaching.strength}
          </p>
          <p className="mt-2 text-sm text-zinc-200">
            <span className="text-amber-300/80">Axe d’amélioration :</span> {coaching.weakness}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          <Star className="h-4 w-4" /> Classement (démo)
        </h2>
        <ol className="space-y-2">
          {board.slice(0, 4).map((e, i) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
            >
              <span className="text-zinc-500">{i + 1}.</span>
              <span className="font-medium text-zinc-100">{e.displayName}</span>
              <span className="text-zinc-400">Démos: {e.demosCompleted}</span>
              <span className="text-emerald-300/80">Conv: {(e.conversionProxy * 100).toFixed(0)}%</span>
              <span className="text-xs text-zinc-500">Score {e.dailyScore.toFixed(0)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
