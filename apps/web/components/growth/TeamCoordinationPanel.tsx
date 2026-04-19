"use client";

import * as React from "react";
import type { CoordinationRole } from "@/modules/growth/team-coordination.types";
import type { CoordinationSummary } from "@/modules/growth/team-coordination.types";
import type { CoordinationTaskAssignment } from "@/modules/growth/team-coordination.types";
import type { ApprovalRecord } from "@/modules/growth/execution-planner-approval.service";
import { suggestDefaultRole } from "@/modules/growth/team-coordination-role-mapper.service";
import type { ExecutionTask } from "@/modules/growth/execution-planner.types";

type EnrichedTask = ExecutionTask & { approval: ApprovalRecord };

const ROLES: CoordinationRole[] = [
  "admin",
  "operator",
  "growth_owner",
  "broker_ops_owner",
  "city_owner",
  "revenue_owner",
];

export function TeamCoordinationPanel({
  locale,
  country,
  viewerUserId,
}: {
  locale: string;
  country: string;
  viewerUserId?: string;
}) {
  const [coord, setCoord] = React.useState<{
    assignments: CoordinationTaskAssignment[];
    summary: CoordinationSummary;
  } | null | "err" | "loading">("loading");
  const [approvedTasks, setApprovedTasks] = React.useState<EnrichedTask[]>([]);
  const [filter, setFilter] = React.useState<"all" | "mine" | CoordinationRole>("all");

  const loadCoord = React.useCallback(() => {
    return fetch("/api/growth/team-coordination", { credentials: "same-origin" }).then((r) => {
      if (!r.ok) return null;
      return r.json() as Promise<{ assignments: CoordinationTaskAssignment[]; summary: CoordinationSummary }>;
    });
  }, []);

  const loadApproved = React.useCallback(() => {
    return fetch("/api/growth/execution-planner/plan?windowDays=14", { credentials: "same-origin" }).then((r) => {
      if (!r.ok) return null;
      return r.json() as Promise<{
        plan: {
          todayTasks: EnrichedTask[];
          weeklyTasks: EnrichedTask[];
        };
      }>;
    });
  }, []);

  React.useEffect(() => {
    let cancel = false;
    void (async () => {
      const [c, p] = await Promise.all([loadCoord(), loadApproved()]);
      if (cancel) return;
      if (!c) {
        setCoord("err");
        return;
      }
      setCoord({ assignments: c.assignments, summary: c.summary });
      if (p?.plan) {
        const appl = [...p.plan.todayTasks, ...p.plan.weeklyTasks].filter((t) => t.approval.status === "approved");
        setApprovedTasks(appl);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [loadApproved, loadCoord]);

  const postCoord = React.useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/growth/team-coordination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const c = await loadCoord();
        const p = await loadApproved();
        if (c) setCoord({ assignments: c.assignments, summary: c.summary });
        if (p?.plan) {
          const appl = [...p.plan.todayTasks, ...p.plan.weeklyTasks].filter((t) => t.approval.status === "approved");
          setApprovedTasks(appl);
        }
      }
    },
    [loadApproved, loadCoord],
  );

  const assignmentByTaskId = React.useMemo(() => {
    const m = new Map<string, CoordinationTaskAssignment>();
    for (const a of coord?.assignments ?? []) m.set(a.taskId, a);
    return m;
  }, [coord?.assignments]);

  const merged = approvedTasks.map((task) => ({
    task,
    assignment: assignmentByTaskId.get(task.id),
    suggested: suggestDefaultRole(task),
  }));

  const rows = merged.filter(({ task, assignment, suggested }) => {
    if (filter === "mine" && viewerUserId) return assignment?.assignedUserId === viewerUserId;
    if (filter !== "all" && filter !== "mine") {
      return assignment?.assignedRole === filter || suggested.role === filter;
    }
    return true;
  });

  if (coord === "loading") {
    return (
      <section className="rounded-xl border border-cyan-900/40 bg-cyan-950/10 p-4" data-growth-team-coordination>
        <p className="text-xs text-zinc-500">Loading team coordination…</p>
      </section>
    );
  }

  if (coord === "err" || !coord) {
    return (
      <section className="rounded-xl border border-cyan-900/40 bg-cyan-950/10 p-4" data-growth-team-coordination>
        <p className="text-sm text-amber-200/90">Team coordination unavailable — enable coordination flags.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-cyan-800/50 bg-cyan-950/15 p-4" data-growth-team-coordination>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300/95">Follow-through</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-50">Team coordination</h3>
          <p className="mt-1 text-[11px] text-zinc-500">
            Shows approved planner tasks only. Assignments are explicit and in-memory (resets on cold start).
            Locale {locale}/{country}.
          </p>
        </div>
        <select
          className="rounded border border-zinc-700 bg-black/40 px-2 py-1 text-xs text-zinc-300"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">All approved</option>
          <option value="mine">My tasks</option>
          <option value="growth_owner">Growth owner</option>
          <option value="broker_ops_owner">Broker ops</option>
          <option value="city_owner">City owner</option>
          <option value="revenue_owner">Revenue owner</option>
          <option value="admin">Admin</option>
          <option value="operator">Operator</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Tracked rows" value={coord.summary.totalTasks} />
        <Metric label="Unassigned" value={coord.summary.unassignedCount} />
        <Metric label="Assigned" value={coord.summary.assignedCount} />
        <Metric label="In progress" value={coord.summary.inProgressCount} />
        <Metric label="Done" value={coord.summary.doneCount} />
        <Metric label="Blocked" value={coord.summary.blockedCount} />
      </div>

      {!approvedTasks.length ? (
        <p className="mt-4 text-sm text-zinc-500">Approve tasks in the execution planner to coordinate them here.</p>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[11px] text-zinc-400">
          <thead className="text-[10px] uppercase text-zinc-500">
            <tr>
              <th className="py-2">Task</th>
              <th className="py-2">Suggested</th>
              <th className="py-2">Why</th>
              <th className="py-2">Role</th>
              <th className="py-2">User</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ task, assignment, suggested }) => (
              <tr key={task.id} className="border-t border-zinc-800/80">
                <td className="py-2 pr-2 align-top text-zinc-300">{task.title}</td>
                <td className="py-2 align-top">{suggested.role}</td>
                <td className="max-w-[180px] py-2 align-top text-[10px] text-zinc-500">{suggested.rationale}</td>
                <td className="py-2 align-top">{assignment?.assignedRole ?? "—"}</td>
                <td className="py-2 align-top">{assignment?.assignedUserId ?? "—"}</td>
                <td className="py-2 align-top">{assignment?.status ?? "unassigned"}</td>
                <td className="py-2 align-top">
                  <div className="flex flex-wrap gap-1">
                    <select
                      className="max-w-[120px] rounded border border-zinc-700 bg-black/50 text-[10px]"
                      defaultValue=""
                      onChange={(e) => {
                        const role = e.target.value as CoordinationRole;
                        if (role) void postCoord({ kind: "assign_role", taskId: task.id, role });
                        e.target.selectedIndex = 0;
                      }}
                    >
                      <option value="">Assign role</option>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rounded border border-zinc-700 px-1 text-[10px] text-zinc-400 hover:bg-zinc-900"
                      onClick={() => void postCoord({ kind: "acknowledge", taskId: task.id })}
                    >
                      Ack
                    </button>
                    <button
                      type="button"
                      className="rounded border border-zinc-700 px-1 text-[10px] text-zinc-400 hover:bg-zinc-900"
                      onClick={() => void postCoord({ kind: "status", taskId: task.id, status: "in_progress" })}
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      className="rounded border border-emerald-900/50 px-1 text-[10px] text-emerald-300 hover:bg-emerald-950/40"
                      onClick={() => void postCoord({ kind: "status", taskId: task.id, status: "done" })}
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      className="rounded border border-rose-900/40 px-1 text-[10px] text-rose-300 hover:bg-rose-950/40"
                      onClick={() => void postCoord({ kind: "status", taskId: task.id, status: "blocked" })}
                    >
                      Block
                    </button>
                    <button
                      type="button"
                      className="rounded border border-zinc-700 px-1 text-[10px] text-zinc-500 hover:bg-zinc-900"
                      onClick={() => void postCoord({ kind: "status", taskId: task.id, status: "skipped" })}
                    >
                      Skip
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-800 p-3 text-[11px] text-zinc-500">
        <p className="font-semibold text-zinc-400">Workload by role</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {coord.summary.byRole.map((r) => (
            <li key={r.role}>
              <span className="text-zinc-400">{r.role}</span>: assigned {r.totalAssigned}, in-flight {r.inProgress}, blocked{" "}
              {r.blocked}, done {r.done}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/25 px-2 py-2">
      <p className="text-[10px] uppercase text-zinc-500">{label}</p>
      <p className="text-lg font-semibold text-zinc-200">{value}</p>
    </div>
  );
}
