import { getTranslations } from "next-intl/server";
import type { SyriaProperty } from "@/generated/prisma";
import { sy8LocationQualityTier, type Sy8LocationQualityTier } from "@/lib/sy8/sy8-feed-rank-compute";

const TONE: Record<Sy8LocationQualityTier, string> = {
  incomplete: "border-amber-200/90 bg-amber-50/90 text-amber-950",
  general: "border-neutral-200 bg-white text-neutral-800",
  medium: "border-sky-200/80 bg-sky-50/90 text-sky-950",
  precise: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950",
};

type Props = {
  listing: Pick<SyriaProperty, "state" | "governorate" | "city" | "area" | "addressDetails">;
  className?: string;
};

function labelForTier(
  t: (k: "locationTier_incomplete" | "locationTier_general" | "locationTier_medium" | "locationTier_precise") => string,
  tier: Sy8LocationQualityTier,
): string {
  switch (tier) {
    case "general":
      return t("locationTier_general");
    case "medium":
      return t("locationTier_medium");
    case "precise":
      return t("locationTier_precise");
    default:
      return t("locationTier_incomplete");
  }
}

export async function Sy8LocationQualityBadge({ listing, className = "" }: Props) {
  const tier = sy8LocationQualityTier(listing);
  const t = await getTranslations("Sy8");
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-medium [dir=rtl]:text-right ${TONE[tier]} ${className}`.trim()}
    >
      {labelForTier(t, tier)}
    </span>
  );
}
