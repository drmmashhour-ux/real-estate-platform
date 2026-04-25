import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  getFieldAgentKpis,
  getFieldAgentLeaderboard,
  SCALING_PHASES,
  TEAM_ROLES_BLURB,
  type FieldAgentRow,
} from "@/modules/field/scaling-field-agents";

export const dynamic = "force-dynamic";

function pct(n: number) {
  return `${(n * 100).toFixed(1)} %`;
}

function roleLabel(r: FieldAgentRow["role"]) {
  if (r === "team_lead") return "Team lead";
  if (r === "ops_control") return "Contrôle (toi)";
  return "Field agent";
}

export default async function AdminFieldScalingPage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?next=/admin/scaling");
  if (!(await isPlatformAdmin(guestId))) redirect("/");

  const rows = getFieldAgentLeaderboard();
  const kpi = getFieldAgentKpis(rows);

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Admin · Field</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Scaling — agents terrain (2 → 10)</h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Structure d’équipe, contrôle qualité et leaderboard. Données d’exemple : brancher <code className="text-zinc-300">Prisma</code> / outils internes quand le tracking est en production.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/field/script" className="text-amber-400 hover:text-amber-300">
              Script mot à mot (terrain) →
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Démos (mock)" value={String(kpi.totalDemos)} hint="Total démos sur l’échantillon" />
          <Kpi label="Taux moyen" value={pct(kpi.avgConversion)} hint="Définition: essai / prochaine étape (à cadrer)" />
          <Kpi label="Durée moyenne démo" value={`${kpi.avgDemoMinutes.toFixed(1)} min`} hint="Cible ≤ 10" />
          <Kpi label="File revue" value={String(kpi.needReview)} hint="Bas perf ou écarts script" />
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Phases de montée en charge</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {SCALING_PHASES.map((p) => (
              <div key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-medium text-amber-200/90">{p.title}</h3>
                <ul className="mt-2 list-inside list-disc text-sm text-zinc-400">
                  {p.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Rôles</h2>
          <ul className="mt-3 space-y-3">
            {TEAM_ROLES_BLURB.map((t) => (
              <li key={t.role} className="text-sm">
                <span className="font-medium text-zinc-200">{t.role}</span>
                <span className="text-zinc-500"> — </span>
                <span className="text-zinc-400">{t.who}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Contrôle qualité (cibles)</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Par agent : <strong className="text-zinc-200">démos réalisées</strong>, <strong className="text-zinc-200">taux de conversion</strong>,{" "}
            <strong className="text-zinc-200">durée moyenne de démo</strong>. Drapeau{" "}
            <span className="text-rose-300">basse performance</span> ou{" "}
            <span className="text-amber-200">déviation de script</span> (retours lead / écoute).
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Leaderboard & activité</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Démos</th>
                  <th className="px-4 py-3">Conversion</th>
                  <th className="px-4 py-3">Durée moy.</th>
                  <th className="px-4 py-3">Écarts script</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-zinc-800/80">
                    <td className="px-4 py-2.5 text-zinc-500">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-zinc-100">{r.displayName}</span>
                      <span className="ml-2 text-xs text-zinc-500">{r.code}</span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300">{roleLabel(r.role)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.demosDone}</td>
                    <td className="px-4 py-2.5 tabular-nums text-emerald-300/90">{pct(r.conversionRate)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.avgDemoTimeMinutes.toFixed(1)} min</td>
                    <td className="px-4 py-2.5 text-center tabular-nums text-zinc-400">{r.scriptDeviationFlags}</td>
                    <td className="px-4 py-2.5">
                      {r.lowPerformance ? (
                        <span className="rounded bg-rose-500/15 px-2 py-0.5 text-xs text-rose-300">Revue requise</span>
                      ) : (
                        <span className="text-xs text-zinc-500">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
