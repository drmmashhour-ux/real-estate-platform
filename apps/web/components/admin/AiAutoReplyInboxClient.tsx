"use client";

import { useCallback, useEffect, useState } from "react";
import { DealAssistantPanel } from "@/components/admin/DealAssistantPanel";

type ConvRow = {
  id: string;
  userId: string | null;
  channel: string;
  status: string;
  assignedToId: string | null;
  humanTakeoverAt: string | null;
  aiReplyPending: boolean;
  outcome: string | null;
  stage?: string;
  pressureScore?: number;
  highIntent: boolean;
  growthAiOutcome: string | null;
  growthAiOutcomeAt: string | null;
  silentNudgeSentAt: string | null;
  highIntentAssistNudgeSentAt: string | null;
  updatedAt: string;
  contextJson: unknown;
  user: { id: string; name: string | null; email: string } | null;
  pendingHandoff: { id: string; reason: string; status: string } | null;
  lastUserMessageAt: string | null;
  lastAiMessageAt: string | null;
  lastHumanMessageAt: string | null;
  staleMarkedAt: string | null;
  lastMessage: {
    senderType: string;
    text: string;
    createdAt: string;
    isNudge?: boolean;
    isAssistClose?: boolean;
    templateKey?: string | null;
    handoffRequired?: boolean;
    detectedObjection?: string | null;
  } | null;
};

type Msg = {
  id: string;
  senderType: string;
  messageText: string;
  detectedIntent: string | null;
  detectedObjection: string | null;
  confidence: number | null;
  handoffRequired: boolean;
  templateKey: string | null;
  ctaType: string | null;
  isNudge?: boolean;
  isAssistClose?: boolean;
  createdAt: string;
};

const OUTCOMES = ["", "new", "replied", "qualified", "booked", "call_scheduled", "handoff", "lost", "stale"] as const;

const STAGES = ["", "new", "engaged", "considering", "high_intent", "closing", "converted", "stale"] as const;

type MetricHealth = "weak" | "ok" | "strong";

type OpsPlaybookPayload = {
  rates: {
    replyRate: number;
    highIntentRate: number;
    conversionRate: number;
    handoffRate: number;
    staleRate: number;
  };
  reply: { health: MetricHealth; hint: string };
  highIntent: { health: MetricHealth; hint: string };
  conversion: { health: MetricHealth; hint: string };
  handoff: { health: MetricHealth; hint: string };
  stale: { health: MetricHealth; hint: string };
  bottleneck: {
    case: "A" | "B" | "C" | "D" | "E" | null;
    title: string;
    problem: string;
    fix: string;
  };
};

function healthStyles(h: MetricHealth): string {
  if (h === "weak") return "text-rose-300";
  if (h === "strong") return "text-emerald-300";
  return "text-amber-200/90";
}

const OBJECTIONS = ["", "price", "trust", "timing", "uncertainty", "none"] as const;

export function AiAutoReplyInboxClient() {
  const [handoffOnly, setHandoffOnly] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState<string>("");
  const [highIntentOnly, setHighIntentOnly] = useState(false);
  const [objectionFilter, setObjectionFilter] = useState<string>("");
  const [handoffRequiredOnly, setHandoffRequiredOnly] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("");
  const [rows, setRows] = useState<ConvRow[]>([]);
  const [metrics, setMetrics] = useState<{
    objectionBreakdown: { objection: string | null; count: number }[];
    outcomeBreakdown?: { outcome: string | null; count: number }[];
    templatePerformance?: {
      templateKey: string | null;
      sent: number;
      replyAfter?: number;
      conversionBooked?: number;
    }[];
    stageBreakdown?: { stage: string; count: number }[];
    stageAnalytics?: {
      stage: string;
      conversations: number;
      booked: number;
      stale: number;
      conversionRate: number;
      dropOffRate: number;
    }[];
    closingStage?: { total: number; booked: number; successRate: number };
    totals?: {
      conversationsOpen: number;
      engaged?: number;
      replied: number;
      booked: number;
      handoff: number;
      stale: number;
      highIntent: number;
      replyRate: number;
      highIntentRate: number;
      conversionRate: number;
      handoffRate: number;
      staleRate: number;
      bookingRate: number;
      highIntentConversion: number;
    };
    opsPlaybook?: OpsPlaybookPayload;
  }>({
    objectionBreakdown: [],
    outcomeBreakdown: [],
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  const loadList = useCallback(async () => {
    const params = new URLSearchParams();
    if (handoffOnly) params.set("handoff", "1");
    if (outcomeFilter) params.set("outcome", outcomeFilter);
    if (highIntentOnly) params.set("highIntent", "1");
    if (objectionFilter) params.set("objection", objectionFilter);
    if (handoffRequiredOnly) params.set("handoffRequired", "1");
    if (stageFilter) params.set("stage", stageFilter);
    const q = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`/api/admin/ai-inbox/conversations${q}`);
    if (!res.ok) return;
    const data = (await res.json()) as { conversations: ConvRow[]; metrics: typeof metrics };
    setRows(data.conversations ?? []);
    if (data.metrics) setMetrics(data.metrics);
  }, [handoffOnly, outcomeFilter, highIntentOnly, objectionFilter, handoffRequiredOnly, stageFilter]);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/ai-inbox/conversations/${id}/messages`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: Msg[] };
    setMessages(data.messages ?? []);
  }, []);

  useEffect(() => {
    void loadList();
    const t = setInterval(() => void loadList(), 15000);
    return () => clearInterval(t);
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    void loadThread(activeId);
    const t = setInterval(() => void loadThread(activeId), 8000);
    return () => clearInterval(t);
  }, [activeId, loadThread]);

  async function sendHumanReply() {
    if (!activeId || !replyText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ai-inbox/conversations/${activeId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        await loadThread(activeId);
        await loadList();
      }
    } finally {
      setLoading(false);
    }
  }

  async function markResolved() {
    if (!activeId) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/ai-inbox/conversations/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      await loadList();
      setActiveId(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" checked={handoffOnly} onChange={(e) => setHandoffOnly(e.target.checked)} />
          Pending handoff only
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <span className="text-slate-500">Outcome</span>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-slate-200"
          >
            {OUTCOMES.map((o) => (
              <option key={o || "all"} value={o}>
                {o === "" ? "All" : o}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" checked={highIntentOnly} onChange={(e) => setHighIntentOnly(e.target.checked)} />
          High intent
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <span className="text-slate-500">Objection</span>
          <select
            value={objectionFilter}
            onChange={(e) => setObjectionFilter(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-slate-200"
          >
            {OBJECTIONS.map((o) => (
              <option key={o || "all"} value={o}>
                {o === "" ? "Any" : o}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={handoffRequiredOnly}
            onChange={(e) => setHandoffRequiredOnly(e.target.checked)}
          />
          AI handoff flag
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <span className="text-slate-500">Stage</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-slate-200"
          >
            {STAGES.map((s) => (
              <option key={s || "all"} value={s}>
                {s === "" ? "All" : s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void loadList()}
          className="rounded-lg border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {metrics.totals ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Five metrics (open conversations only)
            </h2>
            <p className="mt-1 text-[11px] text-slate-600">
              Reply = engaged ÷ total (replied+qualified+call_scheduled+booked) · HI rate · Conversion · Handoff ·
              Stale
            </p>
            <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2">
                <dt className="text-slate-500">1. Reply rate</dt>
                <dd className={`font-medium ${metrics.opsPlaybook ? healthStyles(metrics.opsPlaybook.reply.health) : "text-slate-200"}`}>
                  {(metrics.totals.replyRate * 100).toFixed(1)}%{" "}
                  <span className="block text-[10px] font-normal text-slate-500">
                    {metrics.opsPlaybook?.reply.hint}
                  </span>
                </dd>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2">
                <dt className="text-slate-500">2. High-intent rate</dt>
                <dd
                  className={`font-medium ${metrics.opsPlaybook ? healthStyles(metrics.opsPlaybook.highIntent.health) : "text-slate-200"}`}
                >
                  {(metrics.totals.highIntentRate * 100).toFixed(1)}%{" "}
                  <span className="block text-[10px] font-normal text-slate-500">
                    {metrics.opsPlaybook?.highIntent.hint}
                  </span>
                </dd>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2">
                <dt className="text-slate-500">3. Conversion rate</dt>
                <dd
                  className={`font-medium ${metrics.opsPlaybook ? healthStyles(metrics.opsPlaybook.conversion.health) : "text-slate-200"}`}
                >
                  {(metrics.totals.conversionRate * 100).toFixed(1)}%{" "}
                  <span className="block text-[10px] font-normal text-slate-500">
                    {metrics.opsPlaybook?.conversion.hint}
                  </span>
                </dd>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2">
                <dt className="text-slate-500">4. Handoff rate</dt>
                <dd
                  className={`font-medium ${metrics.opsPlaybook ? healthStyles(metrics.opsPlaybook.handoff.health) : "text-slate-200"}`}
                >
                  {(metrics.totals.handoffRate * 100).toFixed(1)}%{" "}
                  <span className="block text-[10px] font-normal text-slate-500">
                    {metrics.opsPlaybook?.handoff.hint}
                  </span>
                </dd>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2">
                <dt className="text-slate-500">5. Stale rate</dt>
                <dd className={`font-medium ${metrics.opsPlaybook ? healthStyles(metrics.opsPlaybook.stale.health) : "text-slate-200"}`}>
                  {(metrics.totals.staleRate * 100).toFixed(1)}%{" "}
                  <span className="block text-[10px] font-normal text-slate-500">
                    {metrics.opsPlaybook?.stale.hint}
                  </span>
                </dd>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2">
                <dt className="text-slate-500">Counts</dt>
                <dd className="font-normal text-slate-400">
                  total {metrics.totals.conversationsOpen} · engaged {metrics.totals.engaged ?? metrics.totals.replied}{" "}
                  · booked {metrics.totals.booked} · handoff {metrics.totals.handoff} · stale {metrics.totals.stale} ·
                  HI {metrics.totals.highIntent}
                  <span className="mt-1 block text-[10px] text-slate-600">
                    HI → booked: {(metrics.totals.highIntentConversion * 100).toFixed(1)}%
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {metrics.opsPlaybook ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">Primary bottleneck</h3>
                <p className="mt-2 text-sm font-medium text-slate-100">{metrics.opsPlaybook.bottleneck.title}</p>
                <p className="mt-1 text-xs text-slate-400">{metrics.opsPlaybook.bottleneck.problem}</p>
                <p className="mt-2 text-xs text-slate-300">{metrics.opsPlaybook.bottleneck.fix}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Log scan (5 threads)</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
                  <li>Where did the user stop?</li>
                  <li>What did they say last?</li>
                  <li>Was there one clear next step?</li>
                  <li>Did the AI push a concrete action (not just “let me know”)?</li>
                </ul>
                <p className="mt-3 text-[11px] text-slate-600">
                  Fast loop: pick one bottleneck, change one template, sample ~10 users, compare these five metrics.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {(metrics.objectionBreakdown.length > 0 ||
        (metrics.outcomeBreakdown?.length ?? 0) > 0 ||
        (metrics.templatePerformance?.length ?? 0) > 0) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.objectionBreakdown.length > 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI replies by objection</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                {metrics.objectionBreakdown.map((o) => (
                  <span key={o.objection ?? "null"} className="rounded-full border border-slate-700 px-2 py-0.5">
                    {o.objection ?? "—"}: {o.count}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {(metrics.outcomeBreakdown?.length ?? 0) > 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversation outcomes</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                {metrics.outcomeBreakdown?.map((o) => (
                  <span key={o.outcome ?? "null"} className="rounded-full border border-slate-700 px-2 py-0.5">
                    {o.outcome ?? "—"}: {o.count}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {(metrics.stageAnalytics?.length ?? 0) > 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:col-span-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Stage analytics (open conversations)
              </h2>
              <p className="mt-1 text-[11px] text-slate-600">
                Conversion = booked ÷ stage volume · Drop-off = stale ÷ stage volume · Closing success = booked ÷
                closing-stage rows
                {metrics.closingStage != null ? (
                  <span className="ml-2 text-slate-500">
                    ({(metrics.closingStage.successRate * 100).toFixed(1)}% · n={metrics.closingStage.total})
                  </span>
                ) : null}
              </p>
              <div className="mt-2 max-h-36 overflow-auto text-xs">
                <table className="w-full border-collapse text-left text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-500">
                      <th className="py-1 pr-2 font-medium">Stage</th>
                      <th className="py-1 pr-2 font-medium">N</th>
                      <th className="py-1 pr-2 font-medium">Booked</th>
                      <th className="py-1 pr-2 font-medium">Stale</th>
                      <th className="py-1 pr-2 font-medium">Conv %</th>
                      <th className="py-1 font-medium">Drop %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.stageAnalytics?.map((s) => (
                      <tr key={s.stage} className="border-b border-slate-800/80">
                        <td className="py-1 pr-2 font-mono text-[11px]">{s.stage}</td>
                        <td className="py-1 pr-2">{s.conversations}</td>
                        <td className="py-1 pr-2">{s.booked}</td>
                        <td className="py-1 pr-2">{s.stale}</td>
                        <td className="py-1 pr-2">{(s.conversionRate * 100).toFixed(1)}</td>
                        <td className="py-1">{(s.dropOffRate * 100).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {(metrics.templatePerformance?.length ?? 0) > 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:col-span-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template performance</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Sent, user reply after template, and booked conversions (any AI message in thread before outcome).
              </p>
              <div className="mt-2 max-h-40 overflow-auto text-xs">
                <table className="w-full border-collapse text-left text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-500">
                      <th className="py-1 pr-2 font-medium">Template</th>
                      <th className="py-1 pr-2 font-medium">Sent</th>
                      <th className="py-1 pr-2 font-medium">Reply after</th>
                      <th className="py-1 font-medium">Booked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.templatePerformance?.map((t) => (
                      <tr key={t.templateKey ?? "null"} className="border-b border-slate-800/80">
                        <td className="py-1 pr-2 font-mono text-[11px]">{t.templateKey ?? "—"}</td>
                        <td className="py-1 pr-2">{t.sent}</td>
                        <td className="py-1 pr-2">{t.replyAfter ?? "—"}</td>
                        <td className="py-1">{t.conversionBooked ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 lg:col-span-1">
          <div className="divide-y divide-slate-800">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveId(r.id)}
                className={`w-full px-4 py-3 text-left hover:bg-slate-800/50 ${activeId === r.id ? "bg-amber-500/10" : ""} ${
                  r.stage === "closing" ? "border-l-2 border-amber-500/70" : ""
                }`}
              >
                <p className="text-sm font-medium text-slate-100">
                  {r.user?.name ?? r.user?.email ?? "User"}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    {r.stage ? (
                      <span className="mr-1 rounded bg-violet-500/15 px-1.5 py-0.5 text-violet-200">{r.stage}</span>
                    ) : null}
                    {typeof r.pressureScore === "number" ? (
                      <span className="mr-1 rounded bg-slate-700/50 px-1.5 py-0.5 text-slate-300">
                        P{r.pressureScore}
                      </span>
                    ) : null}
                    {r.outcome ? (
                      <span className="mr-1 rounded bg-sky-500/15 px-1.5 py-0.5 text-sky-200">{r.outcome}</span>
                    ) : null}
                    {r.highIntent ? (
                      <span className="mr-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-200">HI</span>
                    ) : null}
                    {r.aiReplyPending ? "· pending AI" : ""}
                    {r.pendingHandoff ? `· handoff${r.pendingHandoff.reason ? `: ${r.pendingHandoff.reason.slice(0, 40)}` : ""}` : ""}
                    {r.growthAiOutcome ? `· ${r.growthAiOutcome}` : ""}
                    {r.silentNudgeSentAt ? "· nudge" : ""}
                    {r.highIntentAssistNudgeSentAt ? "· assist-close nudge" : ""}
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-slate-600">
                  last user: {r.lastUserMessageAt ? new Date(r.lastUserMessageAt).toLocaleString() : "—"} · last AI:{" "}
                  {r.lastAiMessageAt ? new Date(r.lastAiMessageAt).toLocaleString() : "—"}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{r.lastMessage?.text ?? "—"}</p>
                <p className="mt-1 text-[10px] text-slate-600">{new Date(r.updatedAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
          {rows.length === 0 ? <p className="p-6 text-sm text-slate-500">No open conversations.</p> : null}
        </div>

        <div className="space-y-4 lg:col-span-2 xl:grid xl:grid-cols-2 xl:gap-4">
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          {!activeId ? (
            <p className="text-sm text-slate-500">Select a conversation.</p>
          ) : (
            <>
              <div className="max-h-[360px] space-y-2 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg border p-3 text-sm ${
                      m.senderType === "user"
                        ? "border-slate-700 bg-slate-950/50"
                        : m.senderType === "human"
                          ? "border-emerald-800/50 bg-emerald-950/20"
                          : "border-amber-900/40 bg-amber-950/10"
                    }`}
                  >
                    <span className="text-[10px] uppercase text-slate-500">{m.senderType}</span>
                    {m.templateKey ? (
                      <span className="ml-2 text-[10px] text-slate-600">{m.templateKey}</span>
                    ) : null}
                    {m.isNudge ? (
                      <span className="ml-2 text-[10px] text-amber-500/90">nudge</span>
                    ) : null}
                    {m.isAssistClose ? (
                      <span className="ml-2 text-[10px] text-emerald-500/90">assist-close</span>
                    ) : null}
                    <p className="mt-1 whitespace-pre-wrap text-slate-200">{m.messageText}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-600">
                      {m.detectedIntent ? <span>intent: {m.detectedIntent}</span> : null}
                      {m.detectedObjection ? <span>objection: {m.detectedObjection}</span> : null}
                      {m.confidence != null ? <span>conf: {m.confidence.toFixed(2)}</span> : null}
                      {m.ctaType ? <span>cta: {m.ctaType}</span> : null}
                      {m.handoffRequired ? <span className="text-amber-400">handoff</span> : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Human reply…"
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void sendHumanReply()}
                    className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                  >
                    Send as human
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void markResolved()}
                    className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  >
                    Mark resolved
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
          <div className="min-h-0 xl:max-h-[520px] xl:overflow-y-auto">
            <DealAssistantPanel conversationId={activeId} onApplySuggestion={setReplyText} />
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600">
        Enable <code className="text-slate-500">AI_AUTO_REPLY_ENABLED=1</code>. Ghosting nudge:{" "}
        <code className="text-slate-500">POST /api/cron/silent-nudge-worker</code> (~10m),{" "}
        <code className="text-slate-500">AI_SILENT_NUDGE_AFTER_HOURS</code> (default 24). Auto-reply + high-intent assist
        nudge: <code className="text-slate-500">POST /api/cron/auto-reply-worker</code>. Stale outcomes:{" "}
        <code className="text-slate-500">AI_STALE_OUTCOME_AFTER_HOURS</code> (48–72, default 60).
      </p>
    </div>
  );
}
