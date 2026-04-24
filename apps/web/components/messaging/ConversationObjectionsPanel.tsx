type Ob = {
  type: string;
  confidence: number;
  evidence: string[];
  severity: "low" | "medium" | "high";
};

const SEV: Record<Ob["severity"], string> = {
  low: "text-slate-500",
  medium: "text-amber-200/90",
  high: "text-rose-200/90",
};

export function ConversationObjectionsPanel({
  objections,
  dominant,
}: {
  objections: Ob[];
  dominant: string | null;
}) {
  if (objections.length === 0) {
    return (
      <p className="text-[11px] text-slate-500">
        No high-confidence objection classes this pass. Review the last messages in your own words.
      </p>
    );
  }
  return (
    <ul className="space-y-2 text-xs">
      {objections.slice(0, 5).map((o, i) => (
        <li key={i} className="rounded-md border border-white/10 bg-black/25 p-2">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-medium text-slate-200">
              {o.type}
              {dominant === o.type ? (
                <span className="ml-1 text-[9px] uppercase text-violet-300/90">(dominant signal)</span>
              ) : null}
            </span>
            <span className={SEV[o.severity]}>
              {o.severity} · {Math.round(o.confidence * 100)}% class
            </span>
          </div>
          {o.evidence[0] ? <p className="mt-1 break-words text-[10px] text-slate-500">“{o.evidence[0].slice(0, 100)}”</p> : null}
        </li>
      ))}
    </ul>
  );
}
