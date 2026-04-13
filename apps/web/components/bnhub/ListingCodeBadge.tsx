/**
 * Visible public reference for stays / listings (e.g. LST-…).
 */
export function ListingCodeBadge({
  code,
  className = "",
}: {
  code: string | null | undefined;
  className?: string;
}) {
  const c = code?.trim();
  if (!c) return null;
  return (
    <span
      className={`inline-flex items-center rounded-md border border-premium-gold/40 bg-premium-gold/10 px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide text-premium-gold ${className}`.trim()}
    >
      {c}
    </span>
  );
}
