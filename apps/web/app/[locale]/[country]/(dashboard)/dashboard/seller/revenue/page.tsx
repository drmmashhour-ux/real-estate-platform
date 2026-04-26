import Link from "next/link";
import { redirect } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { evaluateFsboRevenuePotential } from "@/src/modules/revenue/revenue.engine";
import { recommendFsboListingPrice } from "@/src/modules/pricing/pricing.engine";
import { revenueV4Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export default async function SellerRevenueInsightsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/seller/revenue");

  const listings = await prisma.fsboListing.findMany({
    where: { ownerId: userId, status: "ACTIVE" },
    select: { id: true, title: true, city: true, priceCents: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  const rows: { id: string; title: string; city: string; priceCents: number; eval: Awaited<ReturnType<typeof evaluateFsboRevenuePotential>>; price: Awaited<ReturnType<typeof recommendFsboListingPrice>> }[] = [];

  for (const l of listings) {
    const evalRow = revenueV4Flags.revenueEngineV1 ? await evaluateFsboRevenuePotential(l.id) : null;
    const price = revenueV4Flags.pricingEngineV1 ? await recommendFsboListingPrice(l.id) : null;
    rows.push({ ...l, eval: evalRow, price });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-slate-100">
      <Link href="/dashboard/seller" className="text-sm text-emerald-400 hover:text-emerald-300">
        ← Seller hub
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Revenue insights</h1>
      <p className="mt-2 text-sm text-slate-400">
        Heuristic scores from your listing performance — not an appraisal. Price bands require your confirmation before any change.
      </p>

      {!revenueV4Flags.revenueEngineV1 && !revenueV4Flags.pricingEngineV1 ? (
        <p className="mt-6 text-sm text-slate-500">Enable FEATURE_REVENUE_ENGINE_V1 or FEATURE_PRICING_ENGINE_V1 to see insights.</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No active listings.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-slate-500">
                {r.city} · list {(r.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}
              </p>
              {r.eval && (
                <p className="mt-2 text-xs text-slate-300">
                  Potential score {r.eval.revenuePotentialScore} ({r.eval.confidence} confidence) — {r.eval.drivers[0]}
                </p>
              )}
              {r.price && (
                <p className="mt-2 text-xs text-amber-200/90">
                  Suggested {(r.price.recommendedPriceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })} · band{" "}
                  {(r.price.priceRangeCents.min / 100).toFixed(0)}–{(r.price.priceRangeCents.max / 100).toFixed(0)} ·{" "}
                  {r.price.dataQualityNote ?? "Review with a professional before publishing changes."}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
