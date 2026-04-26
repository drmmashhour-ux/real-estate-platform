import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AdminHomePage() {
  const t = await getTranslations("Admin");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Link
        href="/admin/listings"
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">{t("tileListings")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("homeListingsDesc")}</p>
      </Link>
      <Link
        href="/admin/bookings"
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">{t("tileBookings")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("homeBookingsDesc")}</p>
      </Link>
      <Link
        href="/admin/payouts"
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">{t("tilePayouts")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("homePayoutsDesc")}</p>
      </Link>
      <Link
        href="/admin/users"
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">{t("tileUsers")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("homeUsersDesc")}</p>
      </Link>
      <Link
        href="/admin/payments"
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">{t("tilePayments")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("homePaymentsDesc")}</p>
      </Link>
      <Link
        href="/admin/promotions"
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">{t("tilePromotions")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("homePromotionsDesc")}</p>
      </Link>
      <Link
        href="/admin/growth"
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">{t("tileGrowth")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("homeGrowthDesc")}</p>
      </Link>
      <Link
        href="/admin/autonomy"
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">{t("tileAutonomy")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("homeAutonomyDesc")}</p>
      </Link>
      <Link
        href="/admin/listing-assistant"
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">{t("tileListingAssistant")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("homeListingAssistantDesc")}</p>
      </Link>
    </div>
  );
}
