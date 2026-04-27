import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { syriaFlags } from "@/lib/platform-flags";

export default async function AdminHomePage() {
  const t = await getTranslations("Admin");
  const tSupply = await getTranslations("AdminSupplyGrowth");
  const mvp = syriaFlags.SYRIA_MVP;

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
        href="/admin/payment-requests"
        className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-sm hover:border-emerald-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">{t("navF1Payments")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("f1RequestsIntro")}</p>
      </Link>
      {!mvp ? (
        <Link
          href="/admin/promotions"
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
        >
          <h2 className="text-lg font-semibold text-stone-900">{t("tilePromotions")}</h2>
          <p className="mt-2 text-sm text-stone-600">{t("homePromotionsDesc")}</p>
        </Link>
      ) : null}
      {!mvp ? (
        <Link
          href="/admin/growth"
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
        >
          <h2 className="text-lg font-semibold text-stone-900">{t("tileGrowth")}</h2>
          <p className="mt-2 text-sm text-stone-600">{t("homeGrowthDesc")}</p>
        </Link>
      ) : null}
      {!mvp ? (
        <Link
          href="/admin/autonomy"
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
        >
          <h2 className="text-lg font-semibold text-stone-900">{t("tileAutonomy")}</h2>
          <p className="mt-2 text-sm text-stone-600">{t("homeAutonomyDesc")}</p>
        </Link>
      ) : null}
      {!mvp ? (
        <Link
          href="/admin/listing-assistant"
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-stone-300"
        >
          <h2 className="text-lg font-semibold text-stone-900">{t("tileListingAssistant")}</h2>
          <p className="mt-2 text-sm text-stone-600">{t("homeListingAssistantDesc")}</p>
        </Link>
      ) : null}
      <Link
        href="/admin/ai"
        className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm hover:border-emerald-300"
      >
        <h2 className="text-lg font-semibold text-stone-900">AI</h2>
        <p className="mt-2 text-sm text-stone-600">Listing quality & search heuristics (SY-13)</p>
      </Link>
      <Link
        href="/admin/supply-growth"
        className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm hover:border-amber-400"
      >
        <h2 className="text-lg font-semibold text-stone-900">{tSupply("tileTitle")}</h2>
        <p className="mt-2 text-sm text-stone-600">{tSupply("tileDesc")}</p>
      </Link>
    </div>
  );
}
