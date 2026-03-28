"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiHub, AiIntent } from "@/modules/ai/core/types";
import { AIAuditNotice } from "./AIAuditNotice";
import { AIActionBar } from "./AIActionBar";

type Props = {
  open: boolean;
  onClose: () => void;
  hub: AiHub;
  feature: string;
  intent: AiIntent;
  title: string;
  context: Record<string, unknown>;
  /** Legal/finance surface — stronger banner */
  legalFinancialSurface?: boolean;
};

export function AIAssistantPanel({
  open,
  onClose,
  hub,
  feature,
  intent,
  title,
  context,
  legalFinancialSurface,
}: Props) {
  const [text, setText] = useState("");
  const [logId, setLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setText("");
    setLogId(null);
    setError(null);
  }, [open, hub, feature, intent]);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ hub, feature, intent, context }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "AI unavailable");
        setText("");
        setLogId(null);
        return;
      }
      setText(typeof j.text === "string" ? j.text : "");
      setLogId(typeof j.logId === "string" ? j.logId : null);
    } catch {
      setError("Network error — try again. Your workflow can continue without AI.");
      setText("");
      setLogId(null);
    } finally {
      setLoading(false);
    }
  }, [hub, feature, intent, context]);

  const sendFeedback = async (feedback: "helpful" | "not_helpful") => {
    if (!logId) return;
    await fetch("/api/ai/interaction-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ logId, feedback }),
    }).catch(() => {});
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="AI assistant"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0c0c0c] shadow-2xl">
        <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-premium-gold">AI assistant</p>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <AIAuditNotice variant="compact" emphasize={legalFinancialSurface} />
          {error ? (
            <p className="mt-3 text-sm text-amber-200/90">{error}</p>
          ) : null}
          <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
            {loading ? (
              <p className="text-sm text-slate-500">Thinking…</p>
            ) : text ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{text}</p>
            ) : (
              <p className="text-sm text-slate-500">Press Run to generate a response.</p>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void run()}
              className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
            >
              {loading ? "Running…" : "Run"}
            </button>
          </div>
          <div className="mt-3">
            <AIActionBar
              busy={loading}
              disabledFeedback={!logId}
              onCopy={() => text && navigator.clipboard.writeText(text)}
              onRetry={() => void run()}
              onHelpful={() => void sendFeedback("helpful")}
              onNotHelpful={() => void sendFeedback("not_helpful")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
