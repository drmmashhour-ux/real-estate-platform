import { ShieldCheck, Star, AlertTriangle } from "lucide-react";
import type { BnhubListingRiskLevel } from "@/modules/bnhub/recommendationEngine";

type Variant = "dark" | "light";

const riskCopy: Record<BnhubListingRiskLevel, { label: string; className: string }> = {
  low: { label: "Low risk", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" },
  medium: { label: "Standard", className: "border-amber-500/40 bg-amber-500/10 text-amber-100" },
  high: { label: "Review carefully", className: "border-red-500/45 bg-red-500/10 text-red-200" },
};

export function TrustBadge({
  verified,
  hostRating,
  reviewCount,
  riskLevel,
  variant = "dark",
  className = "",
}: {
  verified: boolean;
  hostRating: number | null;
  reviewCount?: number;
  riskLevel: BnhubListingRiskLevel;
  variant?: Variant;
  className?: string;
}) {
  const risk = riskCopy[riskLevel];
  const muted = variant === "light" ? "text-slate-600" : "text-white/55";
  const starColor = variant === "light" ? "text-amber-600" : "text-[#D4AF37]";

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {verified ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
            variant === "light"
              ? "border-emerald-600/35 bg-emerald-50 text-emerald-900"
              : "border-[#D4AF37]/45 bg-black/50 text-[#D4AF37]"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Verified
        </span>
      ) : (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            variant === "light" ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/20 bg-white/5 text-white/70"
          }`}
        >
          Unverified
        </span>
      )}
      <span
        className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
          variant === "light" ? "border-slate-200 bg-white text-slate-800" : "border-white/15 bg-white/5 text-white/90"
        }`}
      >
        <Star className={`h-3.5 w-3.5 ${starColor}`} aria-hidden />
        {hostRating != null ? (
          <>
            {hostRating.toFixed(1)}
            {reviewCount != null && reviewCount > 0 ? (
              <span className={muted}>({reviewCount})</span>
            ) : null}
          </>
        ) : reviewCount != null && reviewCount > 0 ? (
          <span className={muted}>
            — ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
          </span>
        ) : (
          <span className={muted}>New host</span>
        )}
      </span>
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${risk.className}`}>
        <AlertTriangle className="h-3 w-3 opacity-80" aria-hidden />
        {risk.label}
      </span>
    </div>
  );
}
