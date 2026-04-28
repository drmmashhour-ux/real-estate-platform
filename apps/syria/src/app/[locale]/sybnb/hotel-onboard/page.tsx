import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HotelOnboardForm } from "@/components/sybnb/HotelOnboardForm";

export default async function SybnbHotelOnboardPage() {
  const t = await getTranslations("SybnbHotelOnboard");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--darlink-text)]">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-[color:var(--darlink-text-muted)]">{t("pageSubtitle")}</p>
      </div>
      <HotelOnboardForm />
      <p className="text-center text-sm text-[color:var(--darlink-text-muted)]">
        <Link href="/sybnb" className="font-medium text-[color:var(--darlink-accent)] hover:underline">
          {t("backSybnb")}
        </Link>
      </p>
    </div>
  );
}
