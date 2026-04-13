import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { AgentSalesClient } from "@/components/agent/AgentSalesClient";
import { assignmentConversionRate } from "@/src/modules/sales/performance";
import { getSalesLeaderboard } from "@/src/modules/sales/performance";
import { getSalesAgentByUserId } from "@/src/modules/sales/queries";

export const dynamic = "force-dynamic";

export default async function AgentSalesDashboardPage() {
  const uid = (await getGuestId())!;

  let agent = null as Awaited<ReturnType<typeof getSalesAgentByUserId>>;
  let board: Awaited<ReturnType<typeof getSalesLeaderboard>> = [];
  try {
    [agent, board] = await Promise.all([getSalesAgentByUserId(uid), getSalesLeaderboard(8)]);
  } catch {
    /* tables missing */
  }

  if (!agent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">
        No sales agent profile. Ask an admin to add you in{" "}
        <Link href="/admin/sales" className="text-emerald-400 hover:underline">
          Admin → Sales
        </Link>
        .
      </div>
    );
  }

  const open = agent.assignments.filter((a) => a.status === "assigned" || a.status === "contacted");
  const perf = agent.performance;
  const assignedTotal = perf?.leadsAssigned ?? agent.assignments.filter((a) => a.status !== "lost").length;
  const closedTotal = perf?.dealsClosed ?? 0;
  const conv = assignmentConversionRate(assignedTotal, closedTotal);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Your pipeline</h1>
      <p className="mt-1 text-sm text-slate-500">
        Priority leads first (CRM `priorityScore`). Actions sync assignment status and touch CRM timestamps.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Open assignments</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{open.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Leads assigned (rollup)</p>
          <p className="mt-1 text-2xl font-semibold text-sky-300">{assignedTotal}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Deals closed</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{closedTotal}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase text-slate-500">Conversion (closed / assigned)</p>
          <p className="mt-1 text-2xl font-semibold text-violet-300">{(conv * 100).toFixed(1)}%</p>
        </div>
      </div>

      {perf ? (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
          <span className="text-slate-500">Attributed revenue (closed):</span>{" "}
          <span className="text-slate-200">${perf.revenue.toLocaleString()}</span>
          <span className="mx-2 text-slate-600">·</span>
          <span className="text-slate-500">Commission tracked:</span>{" "}
          <span className="text-slate-200">${perf.commission.toLocaleString()}</span>
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {board.map((row, i) => (
            <li
              key={row.id}
              className={`flex justify-between rounded-lg border px-3 py-2 ${
                row.agent.userId === uid ? "border-emerald-800 bg-emerald-950/30" : "border-slate-800"
              }`}
            >
              <span className="text-slate-300">
                #{i + 1} {row.agent.user.name ?? row.agent.user.email}
                {row.agent.userId === uid ? " (you)" : ""}
              </span>
              <span className="text-slate-500">
                {row.dealsClosed} closed · ${row.revenue.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Assigned leads & next actions</h2>
        <AgentSalesClient assignments={open} />
      </section>

      <p className="mt-12 text-center text-xs font-medium tracking-wide text-emerald-500/90">
        LECIPM SALES TEAM SYSTEM ACTIVE
      </p>
    </main>
  );
}
