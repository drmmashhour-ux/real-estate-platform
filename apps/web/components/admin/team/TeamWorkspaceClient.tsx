"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { PlatformRole } from "@/types/platform-role";
import type { TeamTaskStatus, TeamTaskPriority, TeamTaskView } from "@/types/team-task-client";

type TaskRow = TeamTaskView & {
  assignee: { id: string; name: string | null; email: string };
  createdBy: { id: string; name: string | null; email: string };
};

type PerfRow = {
  userId: string;
  name: string | null;
  email: string;
  role: PlatformRole;
  tasksAssigned: number;
  tasksDone: number;
  tasksInProgress: number;
  avgImpact: number | null;
  avgCompletionHours: number | null;
  reportsSubmitted: number;
};

const STATUS_LABEL: Record<TeamTaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export function TeamWorkspaceClient(props: {
  role: PlatformRole;
  todayKey: string;
  initialTasks: TaskRow[];
  initialReport: { completedWork: string; results: string | null; issues: string | null } | null;
  taskGoal: number;
  performance: PerfRow[];
}) {
  const { role, todayKey, initialReport, taskGoal, performance } = props;
  const [tasks, setTasks] = useState<TaskRow[]>(props.initialTasks);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [report, setReport] = useState({
    completedWork: initialReport?.completedWork ?? "",
    results: initialReport?.results ?? "",
    issues: initialReport?.issues ?? "",
  });
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  const doneToday = useMemo(() => {
    const start = new Date(`${todayKey}T00:00:00.000Z`).getTime();
    const end = start + 86400000;
    return tasks.filter(
      (t) =>
        t.status === "DONE" &&
        t.completedAt != null &&
        t.completedAt.getTime() >= start &&
        t.completedAt.getTime() < end,
    ).length;
  }, [tasks, todayKey]);

  const refreshTasks = useCallback(async () => {
    const res = await fetch("/api/admin/team/tasks");
    const data = (await res.json()) as { tasks?: TaskRow[] };
    if (data.tasks) setTasks(data.tasks);
  }, []);

  const patchTask = useCallback(
    async (id: string, patch: { status?: TeamTaskStatus; resultNotes?: string | null; impactScore?: number | null }) => {
      setBusyId(id);
      try {
        const res = await fetch(`/api/admin/team/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) return;
        await refreshTasks();
      } finally {
        setBusyId(null);
      }
    },
    [refreshTasks],
  );

  const submitReport = useCallback(async () => {
    setReportMsg(null);
    if (!report.completedWork.trim()) {
      setReportMsg("Describe completed work.");
      return;
    }
    const res = await fetch("/api/admin/team/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportDay: todayKey,
        completedWork: report.completedWork.trim(),
        results: report.results.trim() || undefined,
        issues: report.issues.trim() || undefined,
      }),
    });
    if (!res.ok) {
      setReportMsg("Could not save report.");
      return;
    }
    setReportMsg("Report saved.");
  }, [report, todayKey]);

  return (
    <div className="space-y-10">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Today ({todayKey})</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {doneToday} / {taskGoal} tasks done
          </p>
          <p className="mt-1 text-xs text-zinc-500">Goal is set by admin (default 5).</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Your role</p>
          <p className="mt-1 text-lg font-semibold text-amber-400">{role}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Open tasks</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">My tasks</h2>
        <ul className="mt-4 space-y-3">
          {tasks.length === 0 ? (
            <li className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-sm text-zinc-500">
              No tasks assigned yet. Admins assign work from the same team page.
            </li>
          ) : (
            tasks.map((t) => (
              <li key={t.id} className="rounded-xl border border-zinc-800 bg-[#111] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{t.title}</p>
                    {t.description ? <p className="mt-1 text-sm text-zinc-400">{t.description}</p> : null}
                    <p className="mt-2 text-xs text-zinc-600">
                      Priority: {t.priority} · From: {t.createdBy.name ?? t.createdBy.email}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      className="rounded-lg border border-zinc-700 bg-black px-2 py-1.5 text-sm text-white"
                      value={t.status}
                      disabled={busyId === t.id}
                      onChange={(e) => {
                        const status = e.target.value as TeamTaskStatus;
                        void patchTask(t.id, { status });
                      }}
                    >
                      {(Object.keys(STATUS_LABEL) as TeamTaskStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    {t.status === "DONE" ? (
                      <select
                        className="rounded-lg border border-zinc-700 bg-black px-2 py-1.5 text-sm text-white"
                        value={t.impactScore ?? ""}
                        disabled={busyId === t.id}
                        onChange={(e) => {
                          const v = e.target.value;
                          void patchTask(t.id, {
                            impactScore: v === "" ? null : Number.parseInt(v, 10),
                          });
                        }}
                      >
                        <option value="">Impact (1–5)</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-[#111] p-6">
        <h2 className="text-lg font-semibold text-white">Daily report ({todayKey})</h2>
        <p className="mt-1 text-sm text-zinc-500">Completed work, results, and blockers for this UTC day.</p>
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-medium uppercase text-zinc-500">
            Completed tasks / work
            <textarea
              value={report.completedWork}
              onChange={(e) => setReport((r) => ({ ...r, completedWork: e.target.value }))}
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs font-medium uppercase text-zinc-500">
            Results (optional)
            <textarea
              value={report.results}
              onChange={(e) => setReport((r) => ({ ...r, results: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block text-xs font-medium uppercase text-zinc-500">
            Issues (optional)
            <textarea
              value={report.issues}
              onChange={(e) => setReport((r) => ({ ...r, issues: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => void submitReport()}
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
          >
            Save report
          </button>
          {reportMsg ? <p className="text-sm text-emerald-400">{reportMsg}</p> : null}
        </div>
      </section>

      {role === "ADMIN" && performance.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-white">Team performance (last 14d)</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Operator</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Tasks (window)</th>
                  <th className="px-3 py-2">Done</th>
                  <th className="px-3 py-2">In progress</th>
                  <th className="px-3 py-2">Avg impact</th>
                  <th className="px-3 py-2">Avg completion (h)</th>
                  <th className="px-3 py-2">Reports</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((p) => (
                  <tr key={p.userId} className="border-t border-zinc-800">
                    <td className="px-3 py-2 text-white">{p.name ?? p.email}</td>
                    <td className="px-3 py-2">{p.role}</td>
                    <td className="px-3 py-2">{p.tasksAssigned}</td>
                    <td className="px-3 py-2">{p.tasksDone}</td>
                    <td className="px-3 py-2">{p.tasksInProgress}</td>
                    <td className="px-3 py-2">{p.avgImpact != null ? p.avgImpact.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2">{p.avgCompletionHours != null ? p.avgCompletionHours.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2">{p.reportsSubmitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function TeamAdminTaskForm() {
  const router = useRouter();
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TeamTaskPriority>("NORMAL");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setMsg(null);
    const res = await fetch("/api/admin/team/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeUserId: assigneeUserId.trim(), title: title.trim(), priority }),
    });
    if (!res.ok) {
      setMsg("Could not create task.");
      return;
    }
    setMsg("Task created.");
    setTitle("");
    router.refresh();
  }, [assigneeUserId, title, priority, router]);

  return (
    <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-6">
      <h2 className="text-lg font-semibold text-amber-200">Assign task (admin)</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium uppercase text-zinc-500">
          Assignee user id
          <input
            value={assigneeUserId}
            onChange={(e) => setAssigneeUserId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-sm text-white"
            placeholder="User id"
          />
        </label>
        <label className="block text-xs font-medium uppercase text-zinc-500">
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TeamTaskPriority)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="LOW">LOW</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
          </select>
        </label>
      </div>
      <label className="mt-3 block text-xs font-medium uppercase text-zinc-500">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
        />
      </label>
      <button
        type="button"
        onClick={() => void submit()}
        className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
      >
        Create task
      </button>
      {msg ? <p className="mt-2 text-sm text-emerald-400">{msg}</p> : null}
    </div>
  );
}

export function TeamAdminTargetForm({ defaultDay }: { defaultDay: string }) {
  const [userId, setUserId] = useState("");
  const [targetDay, setTargetDay] = useState(defaultDay);
  const [taskGoal, setTaskGoal] = useState(5);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setMsg(null);
    const res = await fetch("/api/admin/team/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.trim(), targetDay, taskGoal }),
    });
    if (!res.ok) {
      setMsg("Could not save target.");
      return;
    }
    setMsg("Target saved.");
  }, [userId, targetDay, taskGoal]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111] p-6">
      <h2 className="text-lg font-semibold text-white">Daily target (admin)</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-medium uppercase text-zinc-500">
          User id
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-sm text-white"
          />
        </label>
        <label className="block text-xs font-medium uppercase text-zinc-500">
          Day (UTC)
          <input
            value={targetDay}
            onChange={(e) => setTargetDay(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-sm text-white"
          />
        </label>
        <label className="block text-xs font-medium uppercase text-zinc-500">
          Task goal
          <input
            type="number"
            min={0}
            max={500}
            value={taskGoal}
            onChange={(e) => setTaskGoal(Number.parseInt(e.target.value, 10) || 0)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => void submit()}
        className="mt-4 rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
      >
        Save target
      </button>
      {msg ? <p className="mt-2 text-sm text-emerald-400">{msg}</p> : null}
    </div>
  );
}
