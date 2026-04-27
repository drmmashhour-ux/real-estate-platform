"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MARKETPLACE_CATEGORIES, MARKETPLACE_CATEGORY_EMOJI, type MarketplaceCategory } from "@/lib/marketplace-categories";

export function HomeCategoryGrid() {
  const t = useTranslations("Categories");
  return (
    <section className="space-y-3" aria-label={t("homeTitle")}>
      <div>
        <h2 className="text-lg font-bold text-white">{t("homeTitle")}</h2>
        <p className="text-sm text-white/75">{t("homeSubtitle")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {MARKETPLACE_CATEGORIES.map((c: MarketplaceCategory) => (
          <Link
            key={c}
            href={`/category/${c}`}
            className="flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-[var(--darlink-radius-xl)] border border-white/20 bg-white/10 px-2 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:border-amber-300/50 hover:bg-white/15"
          >
            <span className="text-2xl leading-none" aria-hidden>
              {MARKETPLACE_CATEGORY_EMOJI[c]}
            </span>
            <span className="leading-tight">{t(c)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
