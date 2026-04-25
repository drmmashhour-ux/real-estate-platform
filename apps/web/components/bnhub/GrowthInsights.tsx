import Link from "next/link";
import type { GrowthInsight } from "@/lib/bnhub/host-growth-engine";
import { growthInsightActionHref } from "@/lib/bnhub/host-growth-engine";

function severityStyles(severity: GrowthInsight["severity"]) {
  switch (severity) {
    case "watch":
      return "border-amber-500/35 bg-amber-500/[0.06]";
    case "opportunity":
      return "border-emerald-500/35 bg-emerald-500/[0.06]";
    default:
      return "border-white/10 bg-white/[0.03]";
  }
}

function actionLabel(action: NonNullable<GrowthInsight["action"]>): string {
  switch (action) {
    case "adjust_price":
      return "Adjust price";
    case "update_description":
      return "Update description";
    case "add_amenities":
      return "Add amenities";
    case "add_photos":
      return "Add photos";
    case "promotions":
      return "Open promotions";
    default:
      return "Take action";
  }
}

export function GrowthInsights({
  insights,
  listingId,
  pricingHref,
  className = "",
}: {
  insights: GrowthInsight[];
  /** Required for per-insight action links. */
  listingId: string;
  pricingHref: string;
  className?: string;
}) {
  if (!insights.length) return null;

  return (
    <ul className={`space-y-3 ${className}`}>
      {insights.map((insight) => {
        const href = growthInsightActionHref(listingId, insight.action, pricingHref);
        return (
          <li
            key={insight.id}
            className={`rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 ${severityStyles(insight.severity)}`}
          >
            <p className="text-sm font-semibold text-white">{insight.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">{insight.body}</p>
            {href && insight.action ? (
              <Link
                href={href}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/10 px-4 text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
              >
                {actionLabel(insight.action)}
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
