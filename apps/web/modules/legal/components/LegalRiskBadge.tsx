type Level = "MEDIUM" | "HIGH" | "CRITICAL";

const styles: Record<Level, string> = {
  MEDIUM: "border-premium-gold/40 bg-black/60 text-premium-gold",
  HIGH: "border-amber-500/50 bg-amber-950/40 text-amber-200",
  CRITICAL: "border-red-500/50 bg-red-950/40 text-red-200",
};

export function LegalRiskBadge({ level }: { level: Level }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles[level]}`}>
      {level}
    </span>
  );
}
