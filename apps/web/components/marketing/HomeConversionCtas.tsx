"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { reportProductEvent } from "@/lib/analytics/product-analytics";
import { ProductAnalyticsEvents } from "@/lib/analytics/product-events";
import { recordFunnelEvent } from "@/modules/conversion/funnel-metrics.service";

/**
 * Three primary conversion paths above the fold (launch mode): stays, marketplace, list.
 */
export function HomeConversionCtas() {
  const t = useTranslations("home");

  const items = [
    {
      href: "/bnhub/stays" as const,
      label: t("ctaExploreStays"),
      hint: t("ctaExploreStaysHint"),
      surface: "home_cta_stays",
    },
    {
      href: "/listings" as const,
      label: t("ctaBuySell"),
      hint: t("ctaBuySellHint"),
      surface: "home_cta_buy_sell",
    },
    {
      href: "/sell" as const,
      label: t("ctaListProperty"),
      hint: t("ctaListPropertyHint"),
      surface: "home_cta_list",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-[56px] flex-col justify-center rounded-2xl border-2 border-white/12 bg-white/[0.04] px-4 py-3 text-center shadow-sm ring-1 ring-white/5 transition hover:border-[#D4AF37] hover:bg-white/[0.07] active:scale-[0.99] sm:min-h-[60px] sm:text-left"
              onClick={() => {
                recordFunnelEvent("homepage", "CTA_click");
                reportProductEvent(ProductAnalyticsEvents.SEARCH_USAGE, {
                  surface: item.surface,
                  location: null,
                });
              }}
            >
              <span className="text-base font-bold text-white">{item.label}</span>
              <span className="mt-0.5 text-xs text-white/55">{item.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
