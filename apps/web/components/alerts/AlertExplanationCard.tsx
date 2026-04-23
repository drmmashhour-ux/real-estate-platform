"use client";

type Analysis = {
  summary?: string | null;
  whyItMatters?: string | null;
  suggestedActions?: unknown;
  riskFlags?: unknown;
  assumptions?: unknown;
  confidence?: number | null;
};

function asStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export default function AlertExplanationCard({ analysis }: { analysis: Analysis | null | undefined }) {
  if (!analysis) return null;

  const actions = asStrings(analysis.suggestedActions);
  const risks = asStrings(analysis.riskFlags);
  const assumptions = asStrings(analysis.assumptions);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/80 p-4 text-white">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-white/50">AI summary</div>
        <div className="mt-1 text-sm leading-relaxed text-white/90">{analysis.summary ?? "—"}</div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Why this matters</div>
        <div className="mt-1 text-sm leading-relaxed text-white/85">{analysis.whyItMatters ?? "—"}</div>
      </div>

      {actions.length > 0 ? (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Suggested actions (manual)</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
            {actions.map((action, i) => (
              <li key={`${i}-${action.slice(0, 40)}`}>{action}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {assumptions.length > 0 ? (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/45">Assumptions / data limits</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/60">
            {assumptions.map((a, i) => (
              <li key={`${i}-${a.slice(0, 40)}`}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {risks.length > 0 ? (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-300/90">Caution</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200/90">
            {risks.map((flag, i) => (
              <li key={`${i}-${flag.slice(0, 40)}`}>{flag}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="border-t border-white/10 pt-3 text-[11px] text-white/45">
        Model confidence:{" "}
        {analysis.confidence != null && Number.isFinite(analysis.confidence)
          ? `${Math.round(analysis.confidence * 100)}%`
          : "—"}{" "}
        · Advisory only — you decide; nothing runs automatically.
      </div>
    </div>
  );
}
