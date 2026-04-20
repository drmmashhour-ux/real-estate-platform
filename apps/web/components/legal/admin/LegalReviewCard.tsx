"use client";

type Props = {
  variant: "document" | "workflow";
  title: string;
  subtitle: string;
  meta: string[];
  onReview: () => void;
};

export function LegalReviewCard({ variant, title, subtitle, meta, onReview }: Props) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {variant === "document" ? "Document" : "Workflow"}
          </p>
          <p className="text-sm font-medium text-slate-100">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          <ul className="mt-2 space-y-0.5 text-[11px] text-slate-400">
            {meta.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={onReview}
          className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-slate-700"
        >
          Review
        </button>
      </div>
    </div>
  );
}
