import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const KEYS = ["furnished", "family", "quiet", "verified"] as const;

export async function SybnbCategoryChips() {
  const t = await getTranslations("Sybnb.categories");

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-neutral-800">{t("title")}</h2>
      <div className="flex flex-wrap gap-2">
        {KEYS.map((k) => (
          <Link
            key={k}
            href={`/sybnb?q=${encodeURIComponent(t(`q.${k}`))}`}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:border-amber-300/50 hover:shadow"
          >
            {t(`label.${k}`)}
          </Link>
        ))}
      </div>
    </div>
  );
}
