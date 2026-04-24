import type { LecipmTrustOperationalBand } from "@prisma/client";

const STYLES: Record<LecipmTrustOperationalBand, string> = {
  HIGH_TRUST: "border-emerald-500/50 bg-emerald-950/40 text-emerald-100",
  GOOD: "border-sky-500/45 bg-sky-950/35 text-sky-100",
  WATCH: "border-amber-500/50 bg-amber-950/35 text-amber-100",
  ELEVATED_RISK: "border-orange-500/55 bg-orange-950/40 text-orange-100",
  CRITICAL_REVIEW: "border-red-500/55 bg-red-950/45 text-red-100",
};

const LABELS: Record<LecipmTrustOperationalBand, string> = {
  HIGH_TRUST: "High trust",
  GOOD: "Good",
  WATCH: "Watch",
  ELEVATED_RISK: "Elevated risk",
  CRITICAL_REVIEW: "Critical review",
};

export function TrustBandBadge(props: { band: LecipmTrustOperationalBand; className?: string }) {
  const cls = STYLES[props.band];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${cls} ${props.className ?? ""}`}
    >
      {LABELS[props.band]}
    </span>
  );
}
