/**
 * Compact trust badge for property listing cards (Immobilier browse + BNHub when verified).
 */
export function VerifiedListingBadge({
  variant = "dark",
  layout = "overlay",
  className = "",
}: {
  variant?: "dark" | "light";
  /** `overlay` / `overlay-right` = corners on images; `inline` = next to titles on light backgrounds. */
  layout?: "overlay" | "overlay-right" | "inline";
  className?: string;
}) {
  const shell =
    variant === "light"
      ? "border-emerald-600/35 bg-white/95 text-emerald-900 shadow-sm"
      : "border-emerald-500/45 bg-[#0B0B0B]/90 text-emerald-200/95";
  const position =
    layout === "inline"
      ? "relative inline-flex align-middle"
      : layout === "overlay-right"
        ? "absolute right-2 top-2 z-[1]"
        : "absolute left-2 top-2 z-[1]";
  return (
    <span
      className={`${position} rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${shell} ${className}`}
    >
      Verified listing
    </span>
  );
}
