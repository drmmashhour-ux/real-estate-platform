import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSessionUser } from "@/lib/auth";
import { LogoutForm } from "@/components/LogoutForm";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSessionUser();
  const t = await getTranslations("Dashboard");

  const navLink =
    "rounded-[var(--darlink-radius-lg)] px-3 py-2 text-sm font-medium text-[color:var(--darlink-text-muted)] transition hover:bg-[color:var(--darlink-surface-muted)] hover:text-[color:var(--darlink-text)]";

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[var(--darlink-radius-3xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] shadow-[var(--darlink-shadow-md)]">
        <div className="border-b border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/50 px-6 py-6 sm:px-8">
          <h1 className="text-2xl font-bold text-[color:var(--darlink-text)]">{t("shellTitle")}</h1>
          <p className="mt-1 text-sm text-[color:var(--darlink-text-muted)]">{t("shellSubtitle")}</p>
        </div>
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <nav className="flex flex-wrap gap-2" aria-label="Dashboard">
            <Link href="/dashboard" className={navLink}>
              {t("navHome")}
            </Link>
            <Link href="/dashboard/listings" className={navLink}>
              {t("navListings")}
            </Link>
            <Link href="/dashboard/bookings" className={navLink}>
              {t("navBookings")}
            </Link>
            <Link href="/dashboard/payments" className={navLink}>
              {t("navPayments")}
            </Link>
          </nav>
          <LogoutForm />
        </div>
      </div>
      {children}
    </div>
  );
}
