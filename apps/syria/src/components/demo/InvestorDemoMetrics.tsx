import { prisma } from "@/lib/db";
import { INVESTOR_DEMO_TITLE_PREFIX, isDemoDataEnabled } from "@/lib/sybnb/investor-demo";

/**
 * Simulated / database-backed metrics for investor story (only when DEMO_DATA_ENABLED).
 */
export async function InvestorDemoMetrics() {
  if (!isDemoDataEnabled()) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-6 text-sm text-stone-600 [dir=rtl]:text-right">
        <p className="font-medium text-stone-800">Demo metrics are hidden</p>
        <p className="mt-1">Set <code className="rounded bg-white px-1">DEMO_DATA_ENABLED=true</code> after seeding to show safe counts.</p>
      </div>
    );
  }

  const prefix = INVESTOR_DEMO_TITLE_PREFIX;

  const [
    demoListings,
    approvedStays,
    pendingReview,
    demoUsersHost,
    bookingsByState,
  ] = await Promise.all([
    prisma.syriaProperty.count({ where: { titleAr: { startsWith: prefix } } }),
    prisma.syriaProperty.count({
      where: { titleAr: { startsWith: prefix }, sybnbReview: "APPROVED", status: "PUBLISHED" },
    }),
    prisma.syriaProperty.count({
      where: { titleAr: { startsWith: prefix }, sybnbReview: "PENDING" },
    }),
    prisma.syriaAppUser.count({ where: { email: { startsWith: "DEMO_" }, role: "HOST" } }),
    prisma.syriaBooking.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { guest: { email: { startsWith: "DEMO_" } } },
    }),
  ]);

  const conv = bookingsByState.find((b) => b.status === "APPROVED")?._count._all ?? 0;
  const blockedStub = 1;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard label="Demo stay listings (seeded)" value={String(demoListings)} />
      <MetricCard label="Approved & live (subset)" value={String(approvedStays)} />
      <MetricCard label="Listings under SYBNB review" value={String(pendingReview)} />
      <MetricCard label="Verified demo hosts" value={String(demoUsersHost)} />
      <MetricCard label="Booking conversion (demo guest, approved rows)" value={String(conv)} />
      <MetricCard label="Unsafe payment attempts blocked (stub)" value={String(blockedStub)} />
      <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-950 [dir=rtl]:text-right">
        All figures above are <strong>simulated or filtered to DEMO_ / demo titles</strong> — not production analytics and not
        comparable to the main web app metrics style.
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm [dir=rtl]:text-right">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{value}</p>
    </div>
  );
}
