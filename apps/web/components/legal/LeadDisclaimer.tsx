/**
 * Legal-safe copy for lead capture and paid lead unlock — not legal advice.
 */

const DEFAULT_LINES = [
  "LECIPM is a technology intermediary — it connects users with real estate professionals; it is not a party to your transaction.",
  "No outcome or transaction is guaranteed.",
  "Information you provide may be shared with professionals you engage with through the platform.",
] as const;

export function LeadDisclaimer({
  className = "",
  variant = "default",
}: {
  className?: string;
  /** Slightly tighter copy stack for dense CRM cells */
  variant?: "default" | "compact";
}) {
  const pad = variant === "compact" ? "py-2 px-3" : "py-3 px-4";
  return (
    <aside
      className={`rounded-xl border border-white/10 bg-black/40 text-left ${pad} text-[11px] leading-relaxed text-[#9CA3AF] ${className}`}
      role="note"
    >
      <p className="font-semibold uppercase tracking-wide text-[#737373]">Important</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {DEFAULT_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}
