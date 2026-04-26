import Link from "next/link";
import { ListingAnalyticsKind, ListingStatus } from "@prisma/client";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminListingQualityPage() {
  await requireAdminControlUserId();

  const [
    riskAlerts,
    lowest,
    highest,
    trafficLowConversion,
    dist,
  ] = await Promise.all([
    getAdminRiskAlerts(),
    prisma.listingQualityScore.findMany({
      orderBy: { qualityScore: "asc" },
      take: 20,
      include: {
        listing: {
          select: { id: true, title: true, listingCode: true, city: true, listingStatus: true },
        },
      },
    }),
    prisma.listingQualityScore.findMany({
      orderBy: { qualityScore: "desc" },
      take: 20,
      include: {
        listing: {
          select: { id: true, title: true, listingCode: true, city: true, listingStatus: true },
        },
      },
    }),
    prisma.listingAnalytics.findMany({
      where: {
        kind: ListingAnalyticsKind.BNHUB,
        viewsTotal: { gte: 80 },
        bookings: { lte: 2 },
      },
      orderBy: { viewsTotal: "desc" },
      take: 25,
    }),
    prisma.listingQualityScore.groupBy({
      by: ["level"],
      _count: { _all: true },
    }),
  ]);

  const shellAlerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  const analyticsListingIds = trafficLowConversion.map((a) => a.listingId);
  const analyticsScores = await prisma.listingQualityScore.findMany({
    where: { listingId: { in: analyticsListingIds } },
    select: { listingId: true, qualityScore: true, level: true },
  });
  const scoreById = new Map(analyticsScores.map((s) => [s.listingId, s]));

  return (
    <LecipmControlShell alerts={shellAlerts}>
      <div className="space-y-8">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Admin
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Listing quality</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Cached scores in <code className="text-zinc-400">listing_quality_scores</code>. See{" "}
            <code className="text-zinc-400">docs/optimization/listing-quality-system.md</code>.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-white">Level distribution</h2>
          <ul className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-400">
            {dist.map((d) => (
              <li key={d.level}>
                {d.level}: {d._count._all}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Lowest quality (cached)</h2>
          <ul className="mt-2 space-y-2 text-sm text-zinc-400">
            {lowest.map((row) => (
              <li key={row.id}>
                <span className="font-mono text-zinc-300">{row.qualityScore}</span> ·{" "}
                {row.listing?.listingStatus === ListingStatus.PUBLISHED ? (
                  <Link
                    className="text-sky-400 hover:underline"
                    href={`/bnhub/listings/${row.listingId}`}
                  >
                    {row.listing?.title ?? row.listingId}
                  </Link>
                ) : (
                  <span>{row.listing?.title ?? row.listingId}</span>
                )}{" "}
                <span className="text-zinc-600">({row.level})</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Highest quality (cached)</h2>
          <ul className="mt-2 space-y-2 text-sm text-zinc-400">
            {highest.map((row) => (
              <li key={row.id}>
                <span className="font-mono text-zinc-300">{row.qualityScore}</span> ·{" "}
                {row.listing?.listingStatus === ListingStatus.PUBLISHED ? (
                  <Link
                    className="text-sky-400 hover:underline"
                    href={`/bnhub/listings/${row.listingId}`}
                  >
                    {row.listing?.title ?? row.listingId}
                  </Link>
                ) : (
                  <span>{row.listing?.title ?? row.listingId}</span>
                )}{" "}
                <span className="text-zinc-600">({row.level})</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">High traffic / low conversion (heuristic)</h2>
          <p className="mt-1 text-xs text-zinc-500">
            BNHub analytics: many views but few bookings — cross-checked with cached quality when available.
          </p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-400">
            {trafficLowConversion.map((a) => {
              const s = scoreById.get(a.listingId);
              return (
                <li key={a.id}>
                  views {a.viewsTotal} · bookings {a.bookings} · saves {a.saves}
                  {s != null ? (
                    <>
                      {" "}
                      · quality{" "}
                      <span className="font-mono text-zinc-300">{s.qualityScore}</span> ({s.level})
                    </>
                  ) : (
                    " · quality n/a"
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </LecipmControlShell>
  );
}
