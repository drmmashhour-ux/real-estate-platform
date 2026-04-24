"use client";

type Props = {
  before: string;
  after: string;
  /** Accessible label */
  title?: string;
};

export function AiDiffViewer({ before, after, title = "Proposition de réécriture" }: Props) {
  const changed = before !== after;
  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold/90">{title}</p>
      {!changed ? (
        <p className="text-slate-400">Aucun changement détecté.</p>
      ) : (
        <>
          <div>
            <p className="mb-1 text-xs text-slate-500">Avant</p>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border border-white/10 bg-black/60 p-3 text-xs">
              {before}
            </pre>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Après (proposition)</p>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border border-premium-gold/25 bg-black/60 p-3 text-xs">
              {after}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
