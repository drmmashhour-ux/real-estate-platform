"use client";

import { useCallback, useState } from "react";
import { generateReplyResponse } from "@/src/modules/daily-execution/domain/outreachCopy";

export function DailyPerformancePanel({
  metric,
  insights,
  onRefresh,
}: {
  metric: {
    messagesSent: number;
    repliesReceived: number;
    callsBooked: number;
    replyRate: number | null;
    callRate: number | null;
    bestVariantLabel: string | null;
  };
  insights: string[];
  onRefresh: () => Promise<void>;
}) {
  const replyToCall = generateReplyResponse();
  const [replyBusy, setReplyBusy] = useState(false);

  const bumpReply = useCallback(async () => {
    setReplyBusy(true);
    try {
      const res = await fetch("/api/daily-execution/metrics/replies", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: 1 }),
      });
      if (res.ok) await onRefresh();
    } finally {
      setReplyBusy(false);
    }
  }, [onRefresh]);

  const pct = (x: number | null) => (x == null ? "—" : `${Math.round(x * 1000) / 10}%`);

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 text-slate-100">
      <h2 className="text-lg font-semibold">Today’s performance</h2>
      <p className="mt-1 text-xs text-slate-500">From your logged metrics (reply tracking). Not auto-collected from inboxes.</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <dt className="text-xs text-slate-500">Reply rate</dt>
          <dd className="text-xl font-semibold text-emerald-400">{pct(metric.replyRate)}</dd>
          <dd className="text-xs text-slate-500">
            {metric.repliesReceived} replies / {metric.messagesSent} messages
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <dt className="text-xs text-slate-500">Call rate (vs messages)</dt>
          <dd className="text-xl font-semibold text-sky-400">{pct(metric.callRate)}</dd>
          <dd className="text-xs text-slate-500">
            {metric.callsBooked} calls / {metric.messagesSent} messages
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-3 sm:col-span-2">
          <dt className="text-xs text-slate-500">Best script variant (by replies ÷ uses)</dt>
          <dd className="text-sm font-medium text-slate-200">{metric.bestVariantLabel ?? "Log a few uses per variant first."}</dd>
        </div>
      </dl>
      <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3">
        <p className="text-xs font-medium text-slate-400">When they reply — book the call</p>
        <p className="mt-1 text-sm text-slate-300">{replyToCall}</p>
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(replyToCall)}
          className="mt-2 rounded-md border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5"
        >
          Copy
        </button>
      </div>
      <button
        type="button"
        disabled={replyBusy}
        onClick={() => void bumpReply()}
        className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
      >
        {replyBusy ? "Saving…" : "+1 reply received (manual)"}
      </button>
      {insights.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-100/90">
          {insights.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
