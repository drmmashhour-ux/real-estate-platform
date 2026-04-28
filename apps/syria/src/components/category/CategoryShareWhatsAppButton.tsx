"use client";

import { useTranslations } from "next-intl";
import { trackClientAnalyticsEvent } from "@/lib/client-analytics";
import type { MarketplaceCategory } from "@/lib/marketplace-categories";
import { buildWhatsAppMeShareHref } from "@/lib/syria/listing-share";

/** SYBNB-137 — Share category hub on WhatsApp + track `category_shared`. */
export function CategoryShareWhatsAppButton({
  categoryKey,
  shareAbsoluteUrl,
  sharePath,
}: {
  categoryKey: MarketplaceCategory;
  /** When `NEXT_PUBLIC_SYRIA_APP_URL` is set; otherwise client uses `origin + sharePath`. */
  shareAbsoluteUrl: string | null;
  /** Path starting with `/`, including locale — e.g. `/ar/category/cars`. */
  sharePath: string;
}) {
  const t = useTranslations("Categories");
  const categoryLabel = t(categoryKey);

  function resolveUrl(): string {
    if (shareAbsoluteUrl) return shareAbsoluteUrl;
    if (typeof window !== "undefined") {
      return `${window.location.origin}${sharePath}`;
    }
    return "";
  }

  return (
    <button
      type="button"
      className="inline-flex min-h-11 w-full max-w-md items-center justify-center gap-2 rounded-[var(--darlink-radius-xl)] bg-[#25D366] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#20bd5a] active:scale-[0.99] sm:w-auto"
      onClick={() => {
        const link = resolveUrl();
        if (!link) return;
        const text = t("shareCategoryWhatsappMessage", { category: categoryLabel, link });
        trackClientAnalyticsEvent("category_shared", {
          payload: { category: categoryKey },
        });
        window.open(buildWhatsAppMeShareHref(text), "_blank", "noopener,noreferrer");
      }}
    >
      {t("sharePageCta")}
    </button>
  );
}
