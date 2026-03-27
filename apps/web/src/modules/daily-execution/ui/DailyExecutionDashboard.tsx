"use client";

import { useCallback, useEffect, useState } from "react";
import { DailyContentCreator } from "./DailyContentCreator";
import { CallTracker } from "./CallTracker";
import { DailyPerformancePanel } from "./DailyPerformancePanel";
import { FollowUpQueue } from "./FollowUpQueue";
import { LeadPipelineMini } from "./LeadPipelineMini";
import { ScriptVariantsPanel, type VariantRow } from "./ScriptVariantsPanel";

type ApiTask = {
  id: string;
  taskType: string;
  targetCount: number;
  completedCount: number;
  status: string;
  metadata?: unknown;
  repliesNote?: string | null;
};

type FollowUpLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastContactedAt: string | null;
  outreachCoachingStage: string | null;
};

type OverviewPayload = {
  metricDate?: string;
  tasks?: ApiTask[];
  reminders?: string[];
  metric?: {
    messagesSent: number;
    repliesReceived: number;
    callsBooked: number;
    replyRate: number | null;
    callRate: number | null;
    bestVariantLabel: string | null;
  };
  variants?: VariantRow[];
  insights?: string[];
  followUp?: {
    messageTemplate: string;
    leads: FollowUpLeadRow[];
  };
  pipeline?: Record<string, number>;
  report?: { summaryLines?: string[] };
};

function ProgressBar({ label, done, target }: { label: string; done: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>
          {done}/{target}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-500/80 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DailyExecutionDashboard() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [taskDate, setTaskDate] = useState<string>("");
  const [repliesDraft, setRepliesDraft] = useState("");
  const [reportLines, setReportLines] = useState<string[]>([]);
  const [metric, setMetric] = useState<OverviewPayload["metric"]>(undefined);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [followUpLeads, setFollowUpLeads] = useState<FollowUpLeadRow[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/daily-execution/overview", { credentials: "include" });
      const json = (await res.json()) as OverviewPayload;
      if (!res.ok) return;
      if (json.tasks) {
        setTasks(json.tasks);
        setReminders(json.reminders ?? []);
        setTaskDate(json.metricDate ?? "");
        const msg = json.tasks.find((x) => x.taskType === "messages_sent");
        if (msg?.repliesNote) setRepliesDraft(msg.repliesNote);
      }
      if (json.report?.summaryLines) setReportLines(json.report.summaryLines);
      else setReportLines([]);
      if (json.metric) setMetric(json.metric);
      if (json.variants) setVariants(json.variants);
      if (json.insights) setInsights(json.insights);
      if (json.followUp?.leads) setFollowUpLeads(json.followUp.leads);
      if (json.pipeline) setPipeline(json.pipeline);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pick = (type: string) => tasks.find((t) => t.taskType === type) ?? null;

  async function increment(type: string, delta = 1) {
    const res = await fetch("/api/daily-execution/tasks/increment", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskType: type, delta }),
    });
    if (res.ok) void refresh();
  }

  async function saveReplies() {
    await fetch("/api/daily-execution/tasks/replies", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: repliesDraft.trim() || null }),
    });
    void refresh();
  }

  async function callComplete(leadId: string | null) {
    await fetch("/api/daily-execution/calls/complete", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkedLeadId: leadId }),
    });
    void refresh();
  }

  if (loading && tasks.length === 0) {
    return <p className="text-sm text-slate-500">Loading your daily plan…</p>;
  }

  const messages = pick("messages_sent");
  const content = pick("content_posted");
  const calls = pick("calls_booked");
  const onboard = pick("users_onboarded");

  const metricSafe = metric ?? {
    messagesSent: 0,
    repliesReceived: 0,
    callsBooked: 0,
    replyRate: null,
    callRate: null,
    bestVariantLabel: null,
  };

  return (
    <div className="space-y-10">
      <div className="rounded-lg border border-amber-500/25 bg-amber-950/20 p-4 text-sm text-amber-100/90">
        <strong className="font-semibold">Coaching mode:</strong> this screen only assists. You send every message and post
        every piece of content — nothing is sent automatically.
      </div>

      {reminders.length > 0 ? (
        <ul className="space-y-2 rounded-lg border border-violet-500/20 bg-violet-950/15 p-4 text-sm text-violet-100">
          {reminders.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
      ) : null}

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500/90">Daily execution</p>
        <h1 className="text-2xl font-semibold text-slate-100">Today · {taskDate}</h1>
      </header>

      <DailyPerformancePanel metric={metricSafe} insights={insights} onRefresh={refresh} />

      <div className="grid gap-4 sm:grid-cols-2">
        <ProgressBar label="Messages logged" done={messages?.completedCount ?? 0} target={messages?.targetCount ?? 20} />
        <ProgressBar label="Content posted" done={content?.completedCount ?? 0} target={content?.targetCount ?? 1} />
        <ProgressBar label="Calls booked" done={calls?.completedCount ?? 0} target={calls?.targetCount ?? 1} />
        <ProgressBar label="Users onboarded" done={onboard?.completedCount ?? 0} target={onboard?.targetCount ?? 1} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScriptVariantsPanel
          variants={variants}
          messagesTask={messages ? { completedCount: messages.completedCount, targetCount: messages.targetCount } : null}
          onIncrementMessage={() => increment("messages_sent", 1)}
          onRefresh={refresh}
        />
        <DailyContentCreator
          contentTask={content ? { completedCount: content.completedCount, targetCount: content.targetCount } : null}
          onMarkPosted={() => increment("content_posted", 1)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FollowUpQueue leads={followUpLeads} onRefresh={refresh} />
        <LeadPipelineMini pipeline={pipeline} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CallTracker
          callsTask={
            calls
              ? {
                  completedCount: calls.completedCount,
                  targetCount: calls.targetCount,
                  metadata: calls.metadata,
                }
              : null
          }
          onBooked={() => increment("calls_booked", 1)}
          onCompleted={(leadId) => callComplete(leadId)}
        />
        <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 text-slate-100">
          <h2 className="text-lg font-semibold">Onboarding</h2>
          <p className="mt-1 text-xs text-slate-500">Log each user you fully onboarded today.</p>
          <p className="mt-3 text-sm text-slate-400">
            {onboard?.completedCount ?? 0} / {onboard?.targetCount ?? 1}
          </p>
          <button
            type="button"
            disabled={(onboard?.completedCount ?? 0) >= (onboard?.targetCount ?? 1)}
            onClick={() => void increment("users_onboarded", 1)}
            className="mt-4 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/15 disabled:opacity-40"
          >
            +1 user onboarded
          </button>
        </section>
      </div>

      <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 text-slate-100">
        <h2 className="text-lg font-semibold">Replies (optional)</h2>
        <p className="mt-1 text-xs text-slate-500">Quick note for your end-of-day summary — how many replies, hot leads, etc.</p>
        <textarea
          value={repliesDraft}
          onChange={(e) => setRepliesDraft(e.target.value)}
          rows={3}
          className="mt-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100"
        />
        <button
          type="button"
          onClick={() => void saveReplies()}
          className="mt-2 rounded-md border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
        >
          Save note
        </button>
      </section>

      {reportLines.length > 0 ? (
        <section className="rounded-xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-lg font-semibold text-slate-100">End-of-day snapshot</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-400">
            {reportLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
