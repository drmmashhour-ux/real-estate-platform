"use client";

import { useCallback, useEffect, useState } from "react";
import type { AutopilotUiMode } from "@/modules/messaging/autopilot/autopilot.types";

const MODES: { id: AutopilotUiMode; label: string }[] = [
  { id: "OFF", label: "Off" },
  { id: "ASSIST", label: "Assist" },
  { id: "SAFE_AUTOPILOT", label: "Safe autopilot" },
  { id: "FULL_AUTOPILOT_APPROVAL", label: "Full (low-risk send)" },
];

type DraftResult = {
  reply: string;
  confidence: number;
  riskLevel: string;
  requiresApproval: boolean;
  eligibleForLowRiskAutoSend: boolean;
  disclaimer: string;
};

type Props = {
  conversationId: string | null;
  enabled: boolean;
  onInsertDraft: (text: string) => void;
};

export function AutopilotChatBar({ conversationId, enabled, onInsertDraft }: Props) {
  const [mode, setMode] = useState<AutopilotUiMode>("ASSIST");
  const [loadingMode, setLoadingMode] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadMode = useCallback(async () => {
    if (!enabled) return;
    setLoadingMode(true);
    try {
      const res = await fetch("/api/user/messaging-autopilot", { credentials: "same-origin" });
      const j = (await res.json()) as { mode?: AutopilotUiMode; error?: string };
      if (res.ok && j.mode) setMode(j.mode);
    } finally {
      setLoadingMode(false);
    }
  }, [enabled]);

  useEffect(() => {
    void loadMode();
  }, [loadMode]);

  const saveMode = async (next: AutopilotUiMode) => {
    setMode(next);
    await fetch("/api/user/messaging-autopilot", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: next }),
    }).catch(() => {});
  };

  const generateDraft = async () => {
    if (!conversationId) return;
    setDrafting(true);
    setErr(null);
    setDraft(null);
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/autopilot/draft`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = (await res.json()) as DraftResult & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Could not generate");
      setDraft(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setDrafting(false);
    }
  };

  if (!enabled) return null;

  return (
    <div className="border-b border-violet-500/20 bg-violet-950/20 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-violet-200/90" htmlFor="autopilot-mode">
          AI Autopilot Mode
        </label>
        <select
          id="autopilot-mode"
          disabled={loadingMode}
          value={mode}
          onChange={(e) => {
            const v = e.target.value as AutopilotUiMode;
            void saveMode(v);
          }}
          className="rounded-md border border-white/10 bg-black/50 px-2 py-1 text-xs text-slate-100"
        >
          {MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!conversationId || mode === "OFF" || drafting}
          onClick={() => void generateDraft()}
          className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
        >
          {drafting ? "Generating…" : "Generate AI draft"}
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-slate-500">
        Autopilot never sends hidden messages. Low-risk auto-send is offered only when rules allow — you stay in
        control (Quebec brokerage standards).
      </p>
      {err ? <p className="mt-2 text-xs text-rose-400">{err}</p> : null}
      {draft ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/35 p-3 text-xs">
          <div className="flex flex-wrap gap-2 text-[10px] uppercase text-slate-500">
            <span>Risk: {draft.riskLevel}</span>
            <span>Confidence: {draft.confidence}%</span>
            {draft.eligibleForLowRiskAutoSend ? (
              <span className="rounded bg-emerald-500/20 px-1.5 text-emerald-200">Low-risk path</span>
            ) : null}
            {draft.requiresApproval ? (
              <span className="rounded bg-amber-500/20 px-1.5 text-amber-100">Approval recommended</span>
            ) : null}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-100">{draft.reply}</p>
          <p className="mt-2 text-[10px] text-amber-200/90">{draft.disclaimer}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onInsertDraft(draft.reply)}
              className="rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-semibold text-black"
              aria-label="Approve AI draft and insert into message composer"
            >
              Approve & insert
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
