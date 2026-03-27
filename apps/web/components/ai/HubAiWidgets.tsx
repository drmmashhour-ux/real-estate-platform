"use client";

import { useState } from "react";
import type { AiHub, AiIntent } from "@/modules/ai/core/types";
import { AI_CRITICAL_ACTION_NOTICE, messageFromAiApiError } from "@/modules/ai/core/ai-fallbacks";
import { AISuggestionCard } from "./AISuggestionCard";
import { AIExplainButton } from "./AIExplainButton";
import { AIAuditNotice } from "./AIAuditNotice";

type WidgetProps = {
  hub: AiHub;
  feature: string;
  intent?: AiIntent;
  title: string;
  context: Record<string, unknown>;
  accent?: string;
};

/**
 * Lightweight one-shot AI card for dashboards — runs a single feature without the full dock.
 */
export function HubAiInsightWidget({ hub, feature, intent = "analyze", title, context, accent }: WidgetProps) {
  const [text, setText] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setSource(null);
    try {
      const res = await fetch("/api/ai/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ hub, feature, intent, context }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        text?: string;
        source?: string;
        ok?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setText(messageFromAiApiError(res, j));
        return;
      }
      setText(typeof j.text === "string" ? j.text : messageFromAiApiError(res, j));
      setSource(typeof j.source === "string" ? j.source : null);
    } catch {
      setText(messageFromAiApiError(new Response(null, { status: 503 }), {}));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AISuggestionCard
      title={title}
      accent={accent}
      footer={
        <div className="space-y-2">
          <AIExplainButton label="Run AI" onClick={() => void run()} disabled={loading} accent={accent} />
          <p className="text-[10px] uppercase tracking-wide text-slate-600">{AI_CRITICAL_ACTION_NOTICE}</p>
          <AIAuditNotice variant="compact" />
        </div>
      }
    >
      {loading ? <p className="text-slate-500">Loading…</p> : null}
      {!loading && text ? (
        <>
          {source ? (
            <p className="mb-2 text-[10px] text-slate-600">
              Source: <span className="font-mono text-slate-500">{source}</span>
            </p>
          ) : null}
          <p className="whitespace-pre-wrap text-slate-300">{text}</p>
        </>
      ) : null}
      {!loading && !text ? <p className="text-slate-500">Tap Run AI for a short summary.</p> : null}
    </AISuggestionCard>
  );
}
