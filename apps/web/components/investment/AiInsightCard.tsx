"use client";

export function AiInvestmentInsightCard({
  loading,
  summary,
  suggestions,
  source,
}: {
  loading: boolean;
  summary: string | null;
  suggestions: string[];
  source: "openai" | "rules" | null;
}) {
  if (loading) {
    return (
      <div
        className="animate-pulse rounded-2xl border border-violet-500/35 bg-violet-950/25 p-5 sm:p-6"
        aria-busy="true"
        aria-label="Generating insight"
      >
        <div className="h-3 w-28 rounded bg-violet-500/25" />
        <div className="mt-2 h-5 w-48 max-w-[70%] rounded bg-white/10" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-white/[0.06]" />
          <div className="h-3 w-full rounded bg-white/[0.06]" />
          <div className="h-3 w-4/5 rounded bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div
      className="rounded-2xl border border-violet-500/45 bg-gradient-to-br from-violet-950/55 via-slate-950 to-[#0B0B0B] p-5 shadow-[0_0_28px_rgba(139,92,246,0.14)] sm:p-6"
      role="region"
      aria-labelledby="ai-investment-insight-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/90">AI Insight</p>
      <h3 id="ai-investment-insight-heading" className="mt-1 text-lg font-semibold text-white">
        AI Investment Insight
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-200">{summary}</p>
      {suggestions.length > 0 ? (
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-300">
          {suggestions.map((s, i) => (
            <li key={i} className="leading-relaxed">
              {s}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-500">
        {source === "openai"
          ? "Generated from your inputs. Not financial advice — confirm assumptions with a qualified professional."
          : "Based on your inputs using our analysis engine. Not financial advice — confirm assumptions with a qualified professional."}
      </p>
    </div>
  );
}
