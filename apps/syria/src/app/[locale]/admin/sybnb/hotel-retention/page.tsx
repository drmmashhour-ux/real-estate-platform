import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SybnbFollowUpCopyButton } from "@/components/admin/SybnbFollowUpCopyButton";
import {
  SYBNB71_HOTEL_CHECKIN_MESSAGE_AR,
  SYBNB71_HOTEL_UPSELL_LEADS_MESSAGE_AR,
  SYBNB71_HOTEL_RETENTION_MIN_DAY_GAP,
  SYBNB71_HOTEL_RETENTION_MAX_DAY_GAP,
} from "@/lib/sybnb/sybnb-hotel-retention-playbook";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("hotelRetentionPageTitle"),
    description: t("hotelRetentionSubtitle"),
  };
}

export default async function AdminSybnbHotelRetentionPage() {
  const t = await getTranslations("Admin");

  return (
    <div className="space-y-8 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("hotelRetentionKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("hotelRetentionTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("hotelRetentionSubtitle")}</p>
        <p className="mt-3 text-sm">
          <Link href="/admin/sybnb/hotels" className="font-semibold text-amber-900 underline-offset-2 hover:underline">
            {t("hotelRetentionBackToCrm")}
          </Link>
        </p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("hotelRetentionCadenceTitle")}</h2>
        <p className="mt-2 text-sm text-stone-700">{t("hotelRetentionCadenceBody")}</p>
        <p className="mt-3 text-xs font-medium text-stone-500">
          {t("hotelRetentionCadenceWindow", {
            min: SYBNB71_HOTEL_RETENTION_MIN_DAY_GAP,
            max: SYBNB71_HOTEL_RETENTION_MAX_DAY_GAP,
          })}
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">{t("hotelRetentionCheckinTemplateTitle")}</h3>
            <p className="mt-1 text-xs text-stone-500">{t("hotelRetentionCheckinTemplateLead")}</p>
          </div>
          <SybnbFollowUpCopyButton
            text={SYBNB71_HOTEL_CHECKIN_MESSAGE_AR}
            idleLabel={t("hotelRetentionCopyCta")}
            copiedLabel={t("hotelRetentionCopyDone")}
          />
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 font-sans text-sm leading-relaxed text-stone-800">
          {SYBNB71_HOTEL_CHECKIN_MESSAGE_AR}
        </pre>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("hotelRetentionUpsellTitle")}</h2>
        <p className="mt-2 text-sm text-stone-700">{t("hotelRetentionUpsellBody")}</p>
        <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-stone-700">
          <li>{t("hotelRetentionUpsellSignal1")}</li>
          <li>{t("hotelRetentionUpsellSignal2")}</li>
          <li>{t("hotelRetentionUpsellSignal3")}</li>
        </ul>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">{t("hotelRetentionUpsellTemplateTitle")}</h3>
            <p className="mt-1 text-xs text-stone-500">{t("hotelRetentionUpsellTemplateLead")}</p>
          </div>
          <SybnbFollowUpCopyButton
            text={SYBNB71_HOTEL_UPSELL_LEADS_MESSAGE_AR}
            idleLabel={t("hotelRetentionCopyCta")}
            copiedLabel={t("hotelRetentionCopyDone")}
          />
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 font-sans text-sm leading-relaxed text-stone-800">
          {SYBNB71_HOTEL_UPSELL_LEADS_MESSAGE_AR}
        </pre>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("hotelRetentionUpgradeTitle")}</h2>
        <p className="mt-2 text-sm text-stone-700">{t("hotelRetentionUpgradeBody")}</p>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-stone-700">
          <li>{t("hotelRetentionUpgradeFeatured")}</li>
          <li>{t("hotelRetentionUpgradePremium")}</li>
          <li>{t("hotelRetentionUpgradeHotelFeatured")}</li>
          <li>{t("hotelRetentionUpgradeRanking")}</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("hotelRetentionRelationshipTitle")}</h2>
        <p className="mt-2 text-sm text-stone-700">{t("hotelRetentionRelationshipLead")}</p>
        <ul className="mt-4 list-decimal space-y-2 ps-5 text-sm text-stone-700">
          <li>{t("hotelRetentionRelationship1")}</li>
          <li>{t("hotelRetentionRelationship2")}</li>
          <li>{t("hotelRetentionRelationship3")}</li>
        </ul>
      </section>

      <p className="text-xs text-stone-500">{t("hotelRetentionSuccessNote")}</p>
    </div>
  );
}
