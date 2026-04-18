import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { revenueV4Flags, hostEconomicsFlags } from "@/config/feature-flags";
import { buildPlatformPricingSnapshot } from "@/modules/pricing-model/pricing-engine.service";
import { FeeBreakdown } from "@/components/pricing/FeeBreakdown";
import { ROIWidget } from "@/components/pricing/ROIWidget";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId) redirect("/login");

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: userId },
    select: { id: true, title: true, nightPriceCents: true },
  });
  const ids = listings.map((l) => l.id);
  const profs = await prisma.bnhubDynamicPricingProfile.findMany({ where: { listingId: { in: ids } } });
  const pmap = new Map(profs.map((p) => [p.listingId, p]));

  const showTransparency = revenueV4Flags.pricingEngineV1 || hostEconomicsFlags.pricingModelV1;
  const feeSnapshot = showTransparency ? buildPlatformPricingSnapshot() : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/bnhub/host/dashboard" className="text-sm text-emerald-400">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold">Pricing recommendations</h1>
        <p className="text-sm text-slate-500">BNHUB may suggest nightly prices with guardrails — you stay in control unless autopricing is enabled by policy.</p>
        {feeSnapshot ? (
          <div className="space-y-6 pt-4">
            <FeeBreakdown snapshot={feeSnapshot} />
            {hostEconomicsFlags.roiCalculatorV1 ? <ROIWidget /> : null}
          </div>
        ) : null}
        <ul className="space-y-2 text-sm">
          {listings.map((l) => {
            const p = pmap.get(l.id);
            return (
              <li key={l.id} className="flex justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                <Link href={`/bnhub/host/pricing/listings/${l.id}`} className="text-white hover:text-amber-200">
                  {l.title}
                </Link>
                <span className="text-slate-400">
                  Listed ${(l.nightPriceCents / 100).toFixed(0)}
                  {p ? ` · Suggested $${Number(p.recommendedPrice).toFixed(0)}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
