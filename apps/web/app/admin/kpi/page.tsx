import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { paceToTextClass } from "@/modules/field/field-kpi.config";
import { getMockManagerAgents } from "@/modules/field/field-kpi.adapters";
import {
  buildDailyKpiLines,
  buildLeaderboard,
  computeDailyScore,
} from "@/modules/field/field-kpi.engine";
import { TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

const TREND_MOCK: Record<string, { label: string; last: number; prev: number }> = {
  a1: { label: "Maya R.", last: 16, prev: 12 },
  a2: { label: "Alex T.", last: 12, prev: 11 },
  a3: { label: "Sam K.", last: 4, prev: 7 },
};

export default async function AdminFieldKpiPage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?next=/admin/kpi");
  if (!(await isPlatformAdmin(guestId))) redirect("/");

  const agents = getMockManagerAgents();
  const board = buildLeaderboard(agents);

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Admin · Field</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">KPI — vue manager</h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Tous les agents, comparaison des volumes du jour, tendance démos hebdo (mock) jusqu’au data warehouse. Source
            cible: outreach + agenda démo + clôture (voir <code className="text-zinc-300">field-kpi.adapters.ts</code>).
          </p>
          <Link href="/field/kpi" className="text-sm text-amber-400/90 hover:text-amber-300">
            Vue agent terrain →
          </Link>
        </header>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Leaderboard</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Rang</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Démos (jour)</th>
                  <th className="px-4 py-3">Conv. proxy</th>
                  <th className="px-4 py-3">Score jour</th>
                </tr>
              </thead>
              <tbody>
                {board.map((e, i) => (
                  <tr key={e.id} className="border-b border-zinc-800/80">
                    <td className="px-4 py-2.5 text-zinc-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-zinc-100">{e.displayName}</td>
                    <td className="px-4 py-2.5 tabular-nums">{e.demosCompleted}</td>
                    <td className="px-4 py-2.5 text-emerald-300/80">{(e.conversionProxy * 100).toFixed(0)}%</td>
                    <td className="px-4 py-2.5 font-mono text-zinc-200">{e.dailyScore.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Comparaison (jour)</h2>
          <p className="mt-1 text-xs text-zinc-500">Métriques: appels, bookées, complétées, essais, revenu.</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Appels</th>
                  <th className="px-4 py-3">DM</th>
                  <th className="px-4 py-3">Démos book.</th>
                  <th className="px-4 py-3">Démos OK</th>
                  <th className="px-4 py-3">Essais</th>
                  <th className="px-4 py-3">Revenu</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => {
                  const lines = buildDailyKpiLines(a);
                  const pace = lines.find((l) => l.id === "demosCompleted")?.pace ?? "behind";
                  return (
                    <tr key={a.id} className="border-b border-zinc-800/80">
                      <td className="px-4 py-2.5 text-xs text-zinc-500">{a.code}</td>
                      <td className="px-4 py-2.5 text-zinc-200">{a.displayName}</td>
                      <td className="px-4 py-2.5 tabular-nums">{a.callsMade}</td>
                      <td className="px-4 py-2.5 tabular-nums">{a.dmsOrContacts}</td>
                      <td className="px-4 py-2.5 tabular-nums">{a.demosBooked}</td>
                      <td className={cnPace("px-4 py-2.5 tabular-nums", pace)}>{a.demosCompleted}</td>
                      <td className="px-4 py-2.5 tabular-nums">{a.trialsStarted}</td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-300">
                        {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(
                          a.revenueCents / 100,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <TrendingUp className="h-4 w-4" /> Tendances (démos / sem. — mock)
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {Object.values(TREND_MOCK).map((t) => {
              const up = t.last >= t.prev;
              return (
                <li key={t.label} className="flex flex-wrap items-center justify-between gap-2">
                  <span>{t.label}</span>
                  <span>
                    {t.last} vs {t.prev} <span className={up ? "text-emerald-400" : "text-amber-300"}>({up ? "↑" : "↓"})</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function cnPace(base: string, pace: "on_track" | "behind" | "critical") {
  return `${base} ${paceToTextClass(pace)}`;
}
