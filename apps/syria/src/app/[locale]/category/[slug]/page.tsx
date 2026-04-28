import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  isMarketplaceCategory,
  MARKETPLACE_SUBCATEGORIES,
  type MarketplaceCategory,
} from "@/lib/marketplace-categories";
import { browseHrefForMarketplaceSub } from "@/lib/category-browse-href";
import { getSyriaPublicOrigin } from "@/lib/syria-whatsapp";
import { CategoryShareWhatsAppButton } from "@/components/category/CategoryShareWhatsAppButton";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function CategorySubPage(props: Props) {
  const { locale, slug } = await props.params;
  if (!isMarketplaceCategory(slug)) {
    notFound();
  }
  const category = slug as MarketplaceCategory;
  const t = await getTranslations("Categories");
  const subs = [...MARKETPLACE_SUBCATEGORIES[category]];
  const tSub = (s: string) => (t as (key: string) => string)(`sub_${s}`);
  const origin = getSyriaPublicOrigin();
  const sharePath = `/${locale}/category/${category}`;
  const shareAbsoluteUrl = origin.length > 0 ? `${origin}${sharePath}` : null;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-[color:var(--darlink-text)]">
          {t("pageTitle", { name: t(category) })}
        </h1>
        <p className="text-sm text-[color:var(--darlink-text-muted)]">{t("pageSubtitle")}</p>
        <CategoryShareWhatsAppButton
          categoryKey={category}
          shareAbsoluteUrl={shareAbsoluteUrl}
          sharePath={sharePath}
        />
      </header>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {subs.map((sub) => {
          const { href } = browseHrefForMarketplaceSub(category, sub);
          return (
            <Link
              key={sub}
              href={href}
              className="flex min-h-[72px] items-center justify-center rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-center text-sm font-semibold text-[color:var(--darlink-text)] shadow-sm hover:border-[color:var(--darlink-accent)]"
            >
              {tSub(sub)}
            </Link>
          );
        })}
      </div>
      <p className="text-xs text-[color:var(--darlink-text-muted)]">{t("allTypes")}</p>
    </div>
  );
}
