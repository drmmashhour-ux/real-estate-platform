"use client";

export function SectionCard({
  title,
  valuePreview,
  hasRisk,
  riskNote,
  onExplain,
  loading,
}: {
  title: string;
  valuePreview: string;
  hasRisk: boolean;
  riskNote?: string;
  onExplain: () => void;
  loading?: boolean;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-100">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{valuePreview || "—"}</p>
          {hasRisk && riskNote ? (
            <p className="mt-2 text-[11px] text-amber-200/90">{riskNote}</p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={onExplain}
          className="shrink-0 rounded-md border border-premium-gold/50 bg-premium-gold/10 px-2 py-1 text-[11px] font-medium text-premium-gold hover:bg-premium-gold/20 disabled:opacity-50"
        >
          {loading ? "…" : "Explain this"}
        </button>
      </div>
    </section>
  );
}
