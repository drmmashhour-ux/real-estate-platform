import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { INVESTOR_DEMO_TITLE_PREFIX, isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";
import { notFound } from "next/navigation";

export default async function AdminInvestorDemoSybnbPage() {
  if (!isInvestorDemoModeActive()) {
    notFound();
  }

  const t = await getTranslations("InvestorDemo");
  const pfx = INVESTOR_DEMO_TITLE_PREFIX;

  const [byReview, hostVerified, bookingRows, audits] = await Promise.all([
    prisma.syriaProperty.groupBy({
      by: ["sybnbReview"],
      _count: true,
      where: { category: "stay", titleAr: { startsWith: pfx } },
    }),
    prisma.syriaAppUser.groupBy({
      by: ["verificationLevel"],
      _count: true,
      where: { email: { startsWith: "DEMO_" }, role: "HOST" },
    }),
    prisma.syriaBooking.findMany({
      where: { property: { titleAr: { startsWith: pfx } } },
      take: 25,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        guestPaymentStatus: true,
        riskStatus: true,
        property: { select: { titleAr: true, sybnbReview: true } },
      },
    }),
    prisma.syriaSybnbCoreAudit.findMany({
      where: { event: { contains: "demo" } },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: { id: true, event: true, createdAt: true, metadata: true, bookingId: true },
    }),
  ]);

  return (
    <div className="space-y-8 [dir=rtl]:text-right">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">SYBNB — {t("ctaDemoAdmin")}</h1>
        <p className="mt-1 text-sm text-amber-900/80">
          Demo / investor snapshot only. Rows are limited to <code className="rounded bg-white/60 px-1">DEMO</code>{" "}
          listing titles. No PII, no cross-region product names.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-stone-800">Listings by SYBNB review (demo filter)</h2>
          <ul className="mt-2 space-y-1 text-sm text-stone-600">
            {byReview.map((r) => (
              <li key={r.sybnbReview}>
                {r.sybnbReview}: <span className="font-medium text-stone-900">{r._count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-stone-800">Demo hosts by verification (DEMO_ emails)</h2>
          <ul className="mt-2 space-y-1 text-sm text-stone-600">
            {hostVerified.map((r) => (
              <li key={String(r.verificationLevel)}>
                {r.verificationLevel ?? "unset"}: <span className="font-medium text-stone-900">{r._count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-800">Recent demo bookings (status / risk — operator view)</h2>
        <ul className="mt-2 space-y-2 text-sm text-stone-600">
          {bookingRows.map((b) => (
            <li key={b.id} className="rounded-lg border border-stone-100 bg-stone-50/50 px-3 py-2">
              <span className="font-mono text-xs text-stone-500">{b.id.slice(0, 12)}…</span>
              <span className="mx-2 text-stone-400">|</span>
              {b.status} / pay {b.guestPaymentStatus} / risk {b.riskStatus}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-800">Audit preview (demo & security-prefixed events)</h2>
        <ul className="mt-2 space-y-2 text-sm text-stone-600">
          {audits.map((a) => (
            <li key={a.id} className="rounded-lg border border-stone-100 bg-stone-50/50 px-3 py-2">
              <span className="text-xs text-stone-500">{a.createdAt.toISOString()}</span>
              <span className="mx-2">—</span>
              {a.event}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
