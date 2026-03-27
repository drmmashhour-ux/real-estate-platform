/**
 * AI Legal Assistant disclaimer – show next to any AI-generated insight.
 * "AI insights — informational only"
 */

export function AiLegalDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-xs text-slate-500 ${className}`}
      role="note"
      aria-label="AI disclaimer"
    >
      AI insights — informational only. Not legal or professional advice.
    </p>
  );
}
