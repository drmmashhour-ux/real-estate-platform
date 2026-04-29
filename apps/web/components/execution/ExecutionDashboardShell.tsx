"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { LecipmAutonomousExecutionMode, LecipmExecutionTaskView } from "@/types/execution-enums-client";

type TaskRow = LecipmExecutionTaskView & {
  actionLogs: Array<{ id: string; action: string; createdAt: string; resultJson: unknown }>;
};

const modeLabels: Record<LecipmAutonomousExecutionMode, string> = {
  OFF: "Off — AI suggests only (no queued execution)",
  ASSIST: "Assist — AI prepares; you run steps manually",
  SAFE_AUTOMATION: "Safe automation — low-risk drafts may auto-run",
  APPROVAL_REQUIRED: "Approval required — every run needs explicit approval",
};

const card =
  "rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-200 shadow-[0_0_40px_rgb(0_0_0_/_0.35)]";
const btn =
  "rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-1 text-xs font-semibold text-[#f4efe4] hover:bg-[#D4AF37]/20 disabled:opacity-40";

export function ExecutionDashboardShell() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [mode, setMode] = useState<LecipmAutonomousExecutionMode | null>(null);
  const [autoPausedUntil, setAutoPausedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const [tRes, mRes] = await Promise.all([fetch("/api/execution/tasks"), fetch("/api/execution/mode")]);
      const tJson = await tRes.json();
      const mJson = await mRes.json();
      if (!tRes.ok) throw new Error(tJson.error ?? "tasks");
      if (!mRes.ok) throw new Error(mJson.error ?? "mode");
      setTasks(tJson.tasks ?? []);
      setMode(mJson.mode);
      setAutoPausedUntil(mJson.autoPausedUntil ?? null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setExecutionMode(next: LecipmAutonomousExecutionMode) {
    const res = await fetch("/api/execution/mode", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Mode update failed");
      return;
    }
    setMode(data.mode);
    setAutoPausedUntil(data.autoPausedUntil ?? null);
  }

  async function generateTasks() {
    const res = await fetch("/api/execution/tasks/generate", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Generate failed");
      return;
    }
    setMsg(`Generated ${data.created ?? 0} new task(s).`);
    void load();
  }

  async function runAction(path: string, body?: object) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Action failed");
      return;
    }
    void load();
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const executedToday = tasks.filter((t) => t.status === "EXECUTED" && new Date(t.updatedAt) >= todayStart);

  const queue = tasks.filter((t) => ["DRAFT", "QUEUED"].includes(t.status));
  const approval = tasks.filter((t) => t.status === "READY_FOR_APPROVAL" || t.status === "APPROVED");
  const failed = tasks.filter((t) => t.status === "FAILED");

  const riskBreakdown = tasks.reduce(
    (acc, t) => {
      acc[t.riskLevel] = (acc[t.riskLevel] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (loading && !mode) {
    return <div className="p-8 text-neutral-400">Loading execution desk…</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-[#f4efe4] md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]/80">LECIPM · BNHub</p>
            <h1 className="mt-2 font-serif text-3xl">Autonomous execution</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">
              Drafts and internal prep only. No binding dispatch, no payments, no investor solicitation sends. Medium/high-risk rows require approval; safe mode may
              auto-run low-risk drafts.
            </p>
            {autoPausedUntil ?
              <p className="mt-2 text-xs text-amber-300">Auto-run paused until {new Date(autoPausedUntil).toLocaleString()} after repeated failures.</p>
            : null}
            {msg ? <p className="mt-2 text-xs text-neutral-500">{msg}</p> : null}
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <button type="button" className={btn} onClick={() => void load()}>
              Refresh
            </button>
            <button type="button" className={btn} onClick={() => void generateTasks()}>
              Generate tasks from signals
            </button>
            <Link href="/dashboard/signature-center" className="text-xs text-[#D4AF37]/90 hover:underline">
              Signature center →
            </Link>
          </div>
        </header>

        <section className={card}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/90">Execution mode</h2>
          <p className="mt-2 text-xs text-neutral-500">Select how much automation you allow. You keep legal control at the final gate.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(modeLabels) as LecipmAutonomousExecutionMode[]).map((m) => (
              <button
                key={m}
                type="button"
                disabled={!mode}
                className={`rounded-full border px-3 py-1 text-xs ${
                  mode === m ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#f4efe4]" : "border-white/15 text-neutral-400 hover:border-[#D4AF37]/40"
                }`}
                onClick={() => void setExecutionMode(m)}
              >
                {m.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          {mode ? <p className="mt-3 text-xs text-neutral-400">{modeLabels[mode]}</p> : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className={card}>
            <h3 className="text-xs font-semibold uppercase text-neutral-500">Task queue</h3>
            <p className="mt-1 text-2xl font-semibold">{queue.length}</p>
          </div>
          <div className={card}>
            <h3 className="text-xs font-semibold uppercase text-neutral-500">Ready for approval</h3>
            <p className="mt-1 text-2xl font-semibold">{approval.filter((t) => t.status === "READY_FOR_APPROVAL").length}</p>
          </div>
          <div className={card}>
            <h3 className="text-xs font-semibold uppercase text-neutral-500">Executed today</h3>
            <p className="mt-1 text-2xl font-semibold">{executedToday.length}</p>
          </div>
          <div className={card}>
            <h3 className="text-xs font-semibold uppercase text-neutral-500">Failed</h3>
            <p className="mt-1 text-2xl font-semibold text-amber-300">{failed.length}</p>
          </div>
          <div className={`${card} md:col-span-2`}>
            <h3 className="text-xs font-semibold uppercase text-neutral-500">Risk breakdown</h3>
            <p className="mt-2 text-xs text-neutral-400">{JSON.stringify(riskBreakdown)}</p>
          </div>
        </section>

        <TaskSection
          title="Needs approval"
          empty="No tasks awaiting approval."
          tasks={tasks.filter((t) => t.status === "READY_FOR_APPROVAL")}
          actions={(id) => (
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={btn} onClick={() => void runAction(`/api/execution/tasks/${id}/approve`)}>
                Approve
              </button>
              <button type="button" className={btn} onClick={() => void runAction(`/api/execution/tasks/${id}/execute`, { approveFirst: true })}>
                Approve &amp; run prep
              </button>
              <Link href="/dashboard/signature-center" className={`${btn} inline-block text-center`}>
                Approve &amp; sign (binding docs)
              </Link>
              <button type="button" className={btn} onClick={() => void runAction(`/api/execution/tasks/${id}/reject`, { reason: "broker_rejected" })}>
                Reject
              </button>
            </div>
          )}
        />

        <TaskSection
          title="Queued / draft"
          empty="Queue is clear."
          tasks={queue}
          actions={(id) => (
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={btn} onClick={() => void runAction(`/api/execution/tasks/${id}/execute`)}>
                Run prep now
              </button>
            </div>
          )}
        />

        <TaskSection
          title="Failed (retry)"
          empty="No failures."
          tasks={failed}
          actions={(id) => (
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={btn} onClick={() => void runAction(`/api/execution/tasks/${id}/retry`)}>
                Retry
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function TaskSection(props: {
  title: string;
  empty: string;
  tasks: TaskRow[];
  actions: (id: string) => ReactNode;
}) {
  if (props.tasks.length === 0) {
    return (
      <section className={card}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/90">{props.title}</h2>
        <p className="mt-2 text-sm text-neutral-500">{props.empty}</p>
      </section>
    );
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/90">{props.title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {props.tasks.map((t) => (
          <div key={t.id} className={card}>
            <p className="text-[10px] uppercase text-neutral-500">
              {t.taskType.replace(/_/g, " ")} · {t.entityType} ·{" "}
              <span className={t.riskLevel === "HIGH" ? "text-amber-300" : ""}>{t.riskLevel}</span> risk
            </p>
            <p className="mt-1 font-medium text-[#f4efe4]">Status: {t.status}</p>
            <p className="mt-1 text-xs text-neutral-400">Target: {t.entityId}</p>
            <p className="mt-2 text-xs text-neutral-500">
              {(t.aiReasoningJson as { summary?: string })?.summary ??
                (typeof t.aiReasoningJson === "object" && t.aiReasoningJson !== null
                  ? JSON.stringify(t.aiReasoningJson).slice(0, 220)
                  : "")}
            </p>
            {t.lastError ? <p className="mt-1 text-xs text-amber-300">Last error: {t.lastError}</p> : null}
            {props.actions(t.id)}
          </div>
        ))}
      </div>
    </section>
  );
}
