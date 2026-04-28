import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function UltraLiteHomePage() {
  const t = await getTranslations("UltraLite");
  return (
    <div>
      <h1 className="text-base font-bold text-neutral-900">{t("homeTitle")}</h1>
      <p className="mt-2 text-[12px] text-neutral-700">{t("homeBody")}</p>
      <ul className="mt-4 space-y-2 text-[12px] text-neutral-700">
        <li>• {t("homeBulletBrowse")}</li>
        <li>• {t("homeBulletQueue")}</li>
        <li>• {t("homeBulletOffline")}</li>
      </ul>
      <p className="mt-4 text-[11px] text-neutral-500">{t("homePerformance")}</p>
      <Link href="/sybnb" className="mt-4 inline-block text-[12px] font-semibold text-sky-900 underline">
        {t("openFull")}
      </Link>
    </div>
  );
}
