"use client";

export function MortgageAiInsightCard({
  loading,
  text,
  source,
}: {
  loading: boolean;
  text: string | null;
  source: "openai" | "rules" | null;
}) {
  if (loading) {
    return (
      <div
        className="mt-4 animate-pulse rounded-2xl border border-sky-500/35 bg-sky-950/25 p-4"
        aria-busy="true"
        aria-label="Generating mortgage insight"
      >
        <div className="h-3 w-24 rounded bg-sky-500/25" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded bg-white/[0.06]" />
          <div className="h-3 w-[90%] rounded bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  if (!text) return null;

  return (
    <div
      className="mt-4 rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-950/45 to-[#0B0B0B] p-4 shadow-[0_0_20px_rgba(14,165,233,0.12)] sm:p-5"
      role="region"
      aria-labelledby="ai-mortgage-insight-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-300/90">AI Insight</p>
      <h3 id="ai-mortgage-insight-heading" className="mt-1 text-base font-semibold text-white">
        AI Mortgage Insight
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-200">{text}</p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        {source === "openai"
          ? "Generated from your inputs. A licensed broker or lender must confirm eligibility."
          : "Based on your inputs. A licensed broker or lender must confirm eligibility."}
      </p>
    </div>
  );
}
