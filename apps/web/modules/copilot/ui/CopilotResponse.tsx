"use client";

import type { CopilotResponse as CopilotResponseType } from "@/modules/copilot/domain/copilotTypes";

type Props = {
  response: CopilotResponseType | null;
  error: string | null;
  loading: boolean;
};

/** Renders a structured Copilot API response (deterministic content only). */
export function CopilotResponseView({ response, error, loading }: Props) {
  if (loading) {
    return <p className="text-sm text-slate-500">Thinking…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-300">{error}</p>;
  }
  if (!response) {
    return <p className="text-sm text-slate-600">Results appear here.</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-premium-gold/35 bg-premium-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-premium-gold">
          {response.intent.replace(/_/g, " ")}
        </span>
        <span className="text-xs text-slate-500">Confidence: {response.confidence}</span>
      </div>
      <p className="leading-relaxed text-slate-100">{response.summary}</p>
      {response.insights.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Insights</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-slate-400">
            {response.insights.map((line) => (
              <li key={line.slice(0, 80)}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {response.warnings.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/90">Notes</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-amber-200/85">
            {response.warnings.map((w) => (
              <li key={w.slice(0, 80)}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {response.actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {response.actions.map((a) =>
            a.href ? (
              <a
                key={a.id}
                href={a.href}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-premium-gold hover:bg-white/10"
              >
                {a.label}
              </a>
            ) : (
              <span key={a.id} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-500">
                {a.label}
              </span>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
