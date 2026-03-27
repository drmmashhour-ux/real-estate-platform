type Props = { completionPercent: number; contradictionCount: number; warningCount: number };

export function TrustIndicators({ completionPercent, contradictionCount, warningCount }: Props) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-200">{completionPercent}% complete</span>
      <span className={`rounded-full px-2 py-1 ${contradictionCount ? "bg-rose-500/15 text-rose-200" : "bg-emerald-500/15 text-emerald-200"}`}>
        {contradictionCount} contradictions
      </span>
      <span className={`rounded-full px-2 py-1 ${warningCount ? "bg-amber-500/15 text-amber-100" : "bg-emerald-500/15 text-emerald-200"}`}>
        {warningCount} warnings
      </span>
    </div>
  );
}
