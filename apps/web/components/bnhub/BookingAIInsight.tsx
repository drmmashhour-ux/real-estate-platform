/**
 * Single-line, neutral AI-style hint for the BNHub checkout card (decision support).
 */
export function BookingAIInsight({ message }: { message: string }) {
  return (
    <p
      className="rounded-lg border border-slate-700/50 bg-slate-950/40 px-3 py-2 text-center text-xs leading-snug text-slate-400 sm:text-left"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
