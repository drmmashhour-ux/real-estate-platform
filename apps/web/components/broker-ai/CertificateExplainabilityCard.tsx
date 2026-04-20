"use client";

export function CertificateExplainabilityCard(props: {
  reasons?: string[];
  contributingSignals?: string[];
}) {
  const reasons = props.reasons?.filter(Boolean) ?? [];
  const sig = props.contributingSignals?.filter(Boolean) ?? [];
  if (reasons.length === 0 && sig.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-900/40 bg-black/50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600/90">Why this snapshot looks this way</p>
      {reasons.length > 0 ? (
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-300">
          {reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/80" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {sig.length > 0 ? (
        <p className="mt-3 text-[10px] uppercase tracking-wide text-zinc-600">
          Signals: <span className="font-mono text-zinc-500">{sig.join(" · ")}</span>
        </p>
      ) : null}
    </div>
  );
}
