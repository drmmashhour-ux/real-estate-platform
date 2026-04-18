/**
 * Short trust line for broker lead / unlock surfaces.
 */

const ITEMS = [
  "Verified leads (platform rules)",
  "Secure payment via Stripe",
  "No subscription required for pay-per-unlock",
] as const;

export function BrokerLeadTrustStrip({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-xl border border-[#D4AF37]/20 bg-[#111]/80 px-4 py-3 text-[11px] text-[#B3B3B3] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 ${className}`}
      role="note"
    >
      {ITEMS.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <span className="text-[#D4AF37]" aria-hidden>
            ✓
          </span>
          {t}
        </span>
      ))}
    </div>
  );
}
