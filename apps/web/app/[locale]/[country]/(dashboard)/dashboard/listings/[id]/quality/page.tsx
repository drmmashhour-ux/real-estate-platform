import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ListingQualityRecomputeButton } from "./recompute-button";
import { ListingAutopilotPanel } from "./listing-autopilot-panel";

export const dynamic = "force-dynamic";

export default async function ListingQualityDashboardPage({
  params,
}: {
  params: Promise<{ id: string; locale: string; country: string }>;
}) {
  const { id, locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) notFound();

  const listing = await prisma.shortTermListing.findFirst({
    where: { id, ownerId: userId },
    select: { id: true, title: true, listingCode: true, city: true },
  });
  if (!listing) notFound();

  const [row, actions] = await Promise.all([
    prisma.listingQualityScore.findUnique({ where: { listingId: id } }),
    prisma.listingHealthAction.findMany({
      where: { listingId: id, resolved: false },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const base = `/${locale}/${country}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`${base}/bnhub/host/dashboard`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Host dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Listing quality</h1>
      <p className="mt-1 text-sm text-slate-600">
        {listing.title}{" "}
        <span className="text-slate-400">
          · {listing.listingCode} · {listing.city}
        </span>
      </p>

      <div className="mt-8">
        <ListingAutopilotPanel listingId={id} qualityScoreBefore={row?.qualityScore ?? null} />
      </div>

      {!row ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Quality data is still computing. Refresh after a few minutes, or trigger a recompute from your host tools.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Overall score</p>
                <p className="text-4xl font-bold tabular-nums text-slate-900">{row.qualityScore}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold capitalize text-slate-800">{row.level.replace(/_/g, " ")}</p>
                <p className="text-slate-500">Health: {row.healthStatus.replace(/_/g, " ")}</p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              {[
                ["Content", row.contentScore],
                ["Pricing", row.pricingScore],
                ["Performance", row.performanceScore],
                ["Behavior", row.behaviorScore],
                ["Trust", row.trustScore],
              ].map(([label, val]) => (
                <div key={String(label)} className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-medium text-slate-500">{label}</dt>
                  <dd className="text-lg font-semibold tabular-nums text-slate-900">{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Improvements</h2>
            {actions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No open actions — great work.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {actions.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{a.title}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                        {a.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{a.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ListingQualityRecomputeButton listingId={id} />
          <p className="text-xs text-slate-500">
            POST <code className="rounded bg-slate-100 px-1">/api/quality/recompute/{`{listingId}`}</code> with your
            host session (admins may also recompute any listing).
          </p>
        </div>
      )}
    </div>
  );
}
