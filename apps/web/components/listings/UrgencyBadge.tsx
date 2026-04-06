import type { DemandUrgencyLevel } from "@/lib/listings/listing-demand-engine";

export function UrgencyBadge({
  text,
  level = "medium",
  className = "",
}: {
  text: string;
  level?: DemandUrgencyLevel;
  className?: string;
}) {
  const tone =
    level === "high"
      ? "border-red-500/25 bg-red-500/10 text-red-200/95"
      : level === "medium"
        ? "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#E8D589]"
        : "border-white/12 bg-white/[0.06] text-white/75";
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone} ${className}`.trim()}
    >
      {text}
    </span>
  );
}
