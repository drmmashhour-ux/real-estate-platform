"use client";

function categoryLabel(category: string): string {
  switch (category) {
    case "VERY_HIGH":
      return "Very high likelihood";
    case "HIGH":
      return "High likelihood";
    case "MEDIUM":
      return "Moderate likelihood";
    case "LOW":
      return "Low likelihood";
    default:
      return category;
  }
}

export function CloseProbabilityGauge(props: {
  probability: number;
  category: string;
  drivers?: string[];
  risks?: string[];
  /** When true, surfaces an extra warning for LOW category (e.g. before signing). */
  emphasizeLow?: boolean;
  className?: string;
}) {
  const { probability, category, drivers = [], risks = [], emphasizeLow = false, className = "" } = props;
  const pct = Math.round(Math.min(100, Math.max(0, probability)));
  const isLow = category === "LOW";
  const circumference = 2 * Math.PI * 44;
  const dash = (pct / 100) * circumference;

  return (
    <div className={`rounded-xl border border-ds-border bg-ds-card/50 p-4 shadow-ds-soft ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-28 w-28 shrink-0 sm:mx-0">
          <svg className="-rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              className={isLow ? "text-amber-400" : "text-emerald-400"}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-2xl font-semibold text-ds-text">{pct}%</span>
            <span className="text-[9px] uppercase tracking-wide text-ds-text-secondary">close AI</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-ds-text">{categoryLabel(category)}</p>
          <p className="text-[11px] text-ds-text-secondary">
            Estimated close probability: <span className="font-semibold text-ds-text">{pct}%</span> — assistive model
            from financing, diligence, pricing fit, documents, and timeline signals.
          </p>
          {emphasizeLow && isLow ? (
            <p
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
              role="alert"
            >
              Low estimated likelihood — review risks below with your broker before signing.
            </p>
          ) : null}
          {!emphasizeLow && isLow ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90" role="status">
              Below-average close likelihood — confirm open items with counterparties.
            </p>
          ) : null}
          {drivers.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">Drivers</p>
              <ul className="mt-1 list-inside list-disc text-xs text-ds-text">
                {drivers.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {risks.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ds-text-secondary">Risks</p>
              <ul className="mt-1 list-inside list-disc text-xs text-rose-200/90">
                {risks.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
