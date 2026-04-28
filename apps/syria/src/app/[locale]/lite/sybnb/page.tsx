import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Text-first SYBNB hub — aligns with `/sybnb` example mapping (`/lite/sybnb`). */
export default async function UltraLiteSybnbHubPage() {
  const t = await getTranslations("UltraLite");

  return (
    <div>
      <h1 className="text-base font-bold text-neutral-900">{t("sybnbLiteTitle")}</h1>
      <p className="mt-2 text-[12px] text-neutral-700">{t("sybnbLiteBody")}</p>
      <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-semibold text-sky-900 underline">
        <Link href="/lite/listings">{t("navListings")}</Link>
        <Link href="/lite/requests">{t("navRequests")}</Link>
        <Link href="/lite/chat">{t("navChat")}</Link>
      </nav>
      <Link href="/sybnb" className="mt-6 inline-block text-[11px] text-neutral-500 underline">
        {t("openFull")}
      </Link>
    </div>
  );
}
