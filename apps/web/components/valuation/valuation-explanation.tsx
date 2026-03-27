"use client";

type Explanation = {
  mainFactors?: string[];
  positiveFactors?: string[];
  negativeFactors?: string[];
  positionNote?: string;
  dataConfidenceNote?: string;
};

type ValuationExplanationProps = {
  explanation: Explanation | null;
};

export function ValuationExplanationSection({ explanation }: ValuationExplanationProps) {
  if (!explanation) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm">
      <h3 className="font-semibold text-slate-200">Valuation explanation</h3>
      {explanation.mainFactors && explanation.mainFactors.length > 0 && (
        <div className="mt-2">
          <p className="text-slate-500">Main factors</p>
          <ul className="mt-1 list-inside list-disc text-slate-300">
            {explanation.mainFactors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {explanation.positiveFactors && explanation.positiveFactors.length > 0 && (
        <div className="mt-2">
          <p className="text-emerald-500/80">Positive factors</p>
          <ul className="mt-1 list-inside list-disc text-slate-300">
            {explanation.positiveFactors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {explanation.negativeFactors && explanation.negativeFactors.length > 0 && (
        <div className="mt-2">
          <p className="text-amber-500/80">Considerations</p>
          <ul className="mt-1 list-inside list-disc text-slate-300">
            {explanation.negativeFactors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {explanation.positionNote && (
        <p className="mt-2 text-slate-400">{explanation.positionNote}</p>
      )}
      {explanation.dataConfidenceNote && (
        <p className="mt-2 text-xs text-slate-500">{explanation.dataConfidenceNote}</p>
      )}
    </div>
  );
}
