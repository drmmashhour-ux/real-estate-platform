"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CallRow = {
  id: string;
  status: "active" | "ended";
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  metadata?: { recordingConsent?: boolean; transcriptAvailable?: boolean };
};

type LiveHint = { message: string; priority: "low" | "medium" | "high" };

type PostAnalysis = {
  summary: string;
  keyPoints: string[];
  dealStage: { stage: string; rationale: string[] };
  closingReadiness: { score: number; label: string };
};

type Props = {
  conversationId: string | null;
  enabled: boolean;
};

/**
 * In-app call session UI: status, non-intrusive live hints, end call, post-call summary.
 * Does not record or dial by itself; no auto-send. Transcript/recording only with explicit consent.
 */
export function CallPanel({ conversationId, enabled }: Props) {
  const [call, setCall] = useState<CallRow | null>(null);
  const [liveHints, setLiveHints] = useState<LiveHint[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [consentTranscript, setConsentTranscript] = useState(false);
  const [consentRecording, setConsentRecording] = useState(false);
  const [postSummary, setPostSummary] = useState<PostAnalysis | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!call || call.status !== "active") {
      clearPoll();
      return;
    }
    const id = call.id;
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/calls/${encodeURIComponent(id)}/analysis?live=1`, { credentials: "same-origin" });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; liveHints?: LiveHint[] };
      if (j.ok && Array.isArray(j.liveHints)) setLiveHints(j.liveHints);
    }, 4000);
    return () => clearPoll();
  }, [call, clearPoll]);

  useEffect(() => {
    if (!call || call.status !== "active") return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [call]);

  const durationLabel = () => {
    if (!call) return "—";
    void tick;
    const start = Date.parse(call.startedAt);
    const end = call.endedAt ? Date.parse(call.endedAt) : Date.now();
    const sec = Math.max(0, Math.floor((end - start) / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const startCall = async () => {
    if (!conversationId) return;
    setErr(null);
    setLoading(true);
    setPostSummary(null);
    try {
      const res = await fetch("/api/calls/start", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, recordingConsent: consentRecording }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; call?: CallRow; error?: string };
      if (j.ok && j.call) {
        setCall(j.call);
        setLiveHints([]);
        void fetch(`/api/calls/${encodeURIComponent(j.call.id)}/analysis?live=1`, { credentials: "same-origin" })
          .then((r) => r.json())
          .then((c) => {
            const o = c as { liveHints?: LiveHint[] };
            if (Array.isArray(o.liveHints)) setLiveHints(o.liveHints);
          })
          .catch(() => {});
      } else {
        setErr(j.error ?? "Could not start call");
      }
    } finally {
      setLoading(false);
    }
  };

  const endCall = async () => {
    if (!call || call.status !== "active") return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/calls/end", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: call.id,
          transcript: transcript.trim() || undefined,
          transcriptProcessingConsent: consentTranscript,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; call?: CallRow; analysis?: PostAnalysis; error?: string };
      if (j.ok && j.call) {
        setCall(j.call);
        if (j.analysis) setPostSummary(j.analysis);
        setTranscript("");
        setConsentTranscript(false);
      } else {
        setErr(j.error ?? "Could not end call");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) return null;

  return (
    <div className="border-b border-white/10 bg-black/20 p-3 text-left">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Call (local session)</p>
      <p className="mt-1 text-xs text-slate-400">
        Hints and summaries are suggestions only, not legal or financial advice. Recording and transcripts need explicit
        consent (Law 25). Nothing is auto-sent.
      </p>

      {!call || call.status === "ended" ? (
        <div className="mt-2 space-y-2">
          {postSummary ? (
            <div className="rounded border border-white/10 bg-white/5 p-2 text-xs text-slate-200">
              <p className="font-medium text-slate-100">Post-call (heuristic)</p>
              <p className="mt-1 text-slate-300">{postSummary.summary}</p>
              {postSummary.keyPoints?.length ? (
                <ul className="mt-2 list-inside list-disc text-slate-400">
                  {postSummary.keyPoints.slice(0, 4).map((k) => (
                    <li key={k.slice(0, 32)}>{k}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <label className="flex items-start gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={consentRecording}
              onChange={(e) => setConsentRecording(e.target.checked)}
            />
            <span>Recording from a phone provider: I have (or will obtain) explicit consent before attaching a recording URL on end.</span>
          </label>
          <button
            type="button"
            disabled={!conversationId || loading}
            onClick={startCall}
            className="w-full rounded bg-emerald-600/30 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-40"
          >
            {loading ? "…" : "Start call session"}
          </button>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-200">
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-100">Active</span>
            <span className="font-mono text-slate-300">{durationLabel()}</span>
          </div>
          {liveHints.length > 0 ? (
            <div className="max-h-32 overflow-y-auto rounded border border-white/10 bg-white/5 p-2 text-[11px] text-slate-300">
              {liveHints.map((h) => (
                <p key={h.message.slice(0, 40)} className="mb-1 last:mb-0">
                  <span
                    className={
                      h.priority === "high"
                        ? "text-rose-200"
                        : h.priority === "medium"
                          ? "text-amber-200"
                          : "text-slate-400"
                    }
                  >
                    ·{" "}
                  </span>
                  {h.message}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">Live hints refresh every few seconds (timing-based; no audio leaves your device here).</p>
          )}
          <div>
            <p className="text-[10px] text-slate-500">Optional notes / transcript (after the call, with consent to process):</p>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-white/10 bg-black/40 p-1.5 text-xs text-slate-200"
              placeholder="Paste or type call notes — only saved if you consent below"
            />
            <label className="mt-1 flex items-start gap-2 text-[11px] text-slate-400">
              <input
                type="checkbox"
                checked={consentTranscript}
                onChange={(e) => setConsentTranscript(e.target.checked)}
              />
              I have consent to process and store this text in CRM (heuristics only).
            </label>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={endCall}
            className="w-full rounded border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-100 hover:bg-rose-500/20"
          >
            End call & run post-call review
          </button>
        </div>
      )}

      {err ? <p className="mt-2 text-xs text-rose-300">{err}</p> : null}
    </div>
  );
}
