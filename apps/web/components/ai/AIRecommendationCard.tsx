"use client";

const GOLD = "#D4AF37";

export type Rec = {
  id: string;
  title: string;
  description: string;
  confidence: number | null;
  agentKey: string;
  suggestedAction: string | null;
  targetEntityType: string;
  targetEntityId: string;
};

export function AIRecommendationCard({
  rec,
  onDismiss,
  onExecute,
}: {
  rec: Rec;
  onDismiss?: (id: string) => void;
  onExecute?: (rec: Rec) => void;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#141414] p-4 text-sm text-white/85">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-medium text-white">{rec.title}</h3>
        {rec.confidence != null ? (
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/50">
            {(rec.confidence * 100).toFixed(0)}% conf.
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-white/65">{rec.description}</p>
      <p className="mt-2 text-xs text-white/40">
        {rec.agentKey} · {rec.targetEntityType}/{rec.targetEntityId.slice(0, 8)}…
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {onExecute && rec.suggestedAction ? (
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-black"
            style={{ backgroundColor: GOLD }}
            onClick={() => onExecute(rec)}
          >
            Act
          </button>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
            onClick={() => onDismiss(rec.id)}
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </article>
  );
}
