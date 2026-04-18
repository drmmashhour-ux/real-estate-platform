import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";

export default async function DashboardHomePage() {
  const t = await getTranslations("Dashboard");
  const user = await requireSessionUser();

  const [listingCount, bookingCount, paymentCount] = await Promise.all([
    prisma.syriaProperty.count({ where: { ownerId: user.id } }),
    prisma.syriaBooking.count({
      where: {
        OR: [{ guestId: user.id }, { property: { ownerId: user.id } }],
      },
    }),
    prisma.syriaListingPayment.count({ where: { ownerId: user.id } }),
  ]);

  const cardClass =
    "group block rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 shadow-[var(--darlink-shadow-sm)] transition hover:border-[color:var(--darlink-accent)]/35 hover:shadow-[var(--darlink-shadow-md)]";

  return (
    <div className="grid gap-5 md:grid-cols-3">
      <Link href="/dashboard/listings" className={cardClass}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">{t("homeListings")}</p>
        <p className="mt-3 text-4xl font-bold tabular-nums text-[color:var(--darlink-text)]">{listingCount}</p>
        <p className="mt-4 text-sm font-medium text-[color:var(--darlink-accent)] group-hover:underline">{t("dashboardCardCta")}</p>
      </Link>
      <Link href="/dashboard/bookings" className={cardClass}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">{t("homeBookingsLabel")}</p>
        <p className="mt-3 text-4xl font-bold tabular-nums text-[color:var(--darlink-text)]">{bookingCount}</p>
        <p className="mt-4 text-sm font-medium text-[color:var(--darlink-accent)] group-hover:underline">{t("dashboardCardCta")}</p>
      </Link>
      <Link href="/dashboard/payments" className={cardClass}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">{t("homePaymentsLabel")}</p>
        <p className="mt-3 text-4xl font-bold tabular-nums text-[color:var(--darlink-text)]">{paymentCount}</p>
        <p className="mt-4 text-sm font-medium text-[color:var(--darlink-accent)] group-hover:underline">{t("dashboardCardCta")}</p>
      </Link>
    </div>
  );
}
