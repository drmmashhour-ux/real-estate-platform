import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { LogoutForm } from "@/components/LogoutForm";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const t = await getTranslations("Admin");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-amber-950">{t("shellTitle")}</h1>
          <p className="text-sm text-amber-900/80">{t("shellSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-amber-950">
          <Link href="/admin/listings" className="hover:underline">
            {t("navListings")}
          </Link>
          <Link href="/admin/bookings" className="hover:underline">
            {t("navBookings")}
          </Link>
          <Link href="/admin/payouts" className="hover:underline">
            {t("navPayouts")}
          </Link>
          <Link href="/admin/payments" className="hover:underline">
            {t("navPayments")}
          </Link>
          <Link href="/admin/promotions" className="hover:underline">
            {t("navPromotions")}
          </Link>
          <Link href="/admin/growth" className="hover:underline">
            {t("navGrowth")}
          </Link>
          <Link href="/admin/autonomy" className="hover:underline">
            {t("navAutonomy")}
          </Link>
          <Link href="/admin/users" className="hover:underline">
            {t("navUsers")}
          </Link>
          <Link href="/admin/listing-assistant" className="hover:underline">
            {t("navListingAssistant")}
          </Link>
          <Link href="/" className="hover:underline">
            {t("navSite")}
          </Link>
          <LogoutForm />
        </div>
      </div>
      {children}
    </div>
  );
}
