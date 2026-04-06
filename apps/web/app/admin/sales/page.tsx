import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { SalesTeamAdminClient } from "@/components/admin/SalesTeamAdminClient";
import { assignmentConversionRate } from "@/src/modules/sales/performance";
import { getSalesLeaderboard } from "@/src/modules/sales/performance";
import { listRecentAssignments, listSalesAgentsWithStats } from "@/src/modules/sales/queries";

export const dynamic = "force-dynamic";

export default async function AdminSalesTeamPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  let agents: Awaited<ReturnType<typeof listSalesAgentsWithStats>> = [];
  let assignments: Awaited<ReturnType<typeof listRecentAssignments>> = [];
  let board: Awaited<ReturnType<typeof getSalesLeaderboard>> = [];
  try {
    [agents, assignments, board] = await Promise.all([
      listSalesAgentsWithStats(),
      listRecentAssignments(40),
      getSalesLeaderboard(15),
    ]);
  } catch {
    /* migration */
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Revenue org</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sales team</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Agents, automatic lead distribution, performance rollups, commission tracking, and leaderboard. CRM sync
            via `introducedByBrokerId` / assignment status.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
              ← Admin home
            </Link>
            <Link href="/agent/dashboard" className="text-sky-400 hover:text-sky-300">
              Agent dashboard →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <SalesTeamAdminClient />
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Agents</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Active</th>
                  <th className="py-2 pr-4">Assignments</th>
                  <th className="py-2 pr-4">Leads (rollup)</th>
                  <th className="py-2 pr-4">Closed</th>
                  <th className="py-2 pr-4">Revenue</th>
                  <th className="py-2">Commission</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-slate-600">
                      No agents yet.
                    </td>
                  </tr>
                ) : (
                  agents.map((a) => {
                    const p = a.performance;
                    const conv = assignmentConversionRate(p?.leadsAssigned ?? 0, p?.dealsClosed ?? 0);
                    return (
                      <tr key={a.id} className="border-b border-slate-800/80">
                        <td className="py-2 pr-4 text-slate-300">{a.user.email}</td>
                        <td className="py-2 pr-4">{a.role}</td>
                        <td className="py-2 pr-4">{a.priority}</td>
                        <td className="py-2 pr-4">{a.active ? "yes" : "no"}</td>
                        <td className="py-2 pr-4">{a._count.assignments}</td>
                        <td className="py-2 pr-4">{p?.leadsAssigned ?? 0}</td>
                        <td className="py-2 pr-4">
                          {p?.dealsClosed ?? 0}{" "}
                          <span className="text-xs text-slate-600">({(conv * 100).toFixed(0)}%)</span>
                        </td>
                        <td className="py-2 pr-4">${(p?.revenue ?? 0).toLocaleString()}</td>
                        <td className="py-2">${(p?.commission ?? 0).toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
          <ol className="mt-4 space-y-2 text-sm">
            {board.map((row, i) => (
              <li key={row.id} className="flex justify-between rounded-lg border border-slate-800 px-3 py-2">
                <span className="text-slate-300">
                  #{i + 1} {row.agent.user.name ?? row.agent.user.email}
                </span>
                <span className="text-slate-500">
                  {row.dealsClosed} deals · ${row.revenue.toLocaleString()} · comm ${row.commission.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white">Recent assignments</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            {assignments.map((x) => (
              <li key={x.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-800/60 py-2">
                <span>
                  {x.lead.name} <span className="text-slate-600">·</span> {x.status}
                </span>
                <span className="text-slate-500">{x.agent.user.email}</span>
              </li>
            ))}
            {assignments.length === 0 ? <li className="text-slate-600">No rows yet.</li> : null}
          </ul>
          <p className="mt-12 text-center text-xs font-medium tracking-wide text-emerald-500/90">
            LECIPM SALES TEAM SYSTEM ACTIVE
          </p>
        </div>
      </section>
    </main>
  );
}
