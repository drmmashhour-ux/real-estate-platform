/** Shared label for AI advisory content – informational only. */
export function AiAdvisoryLabel({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-slate-500 ${className}`}>
      AI insights — informational only
    </p>
  );
}
