import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@repo/db";
import { PricingRecommendationCard } from "@/components/bnhub/quality/BnhubQualityKit";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const { listingId } = await params;

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { title: true, city: true, nightPriceCents: true },
  });
  if (!listing) notFound();

  const prof = await prisma.bnhubDynamicPricingProfile.findUnique({ where: { listingId } });
  const hist = await prisma.bnhubPricingHistory.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <HubLayout title="Listing pricing" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="max-w-xl space-y-4 text-white">
        <Link href="/admin/bnhub/pricing" className="text-sm text-amber-400">
          ← List
        </Link>
        <h1 className="text-xl font-bold">{listing.title}</h1>
        <p className="text-sm text-zinc-500">Host-listed: ${(listing.nightPriceCents / 100).toFixed(2)} / night</p>
        {prof ? (
          <PricingRecommendationCard
            recommendedUsd={Number(prof.recommendedPrice).toFixed(2)}
            minUsd={Number(prof.minPrice).toFixed(2)}
            maxUsd={Number(prof.maxPrice).toFixed(2)}
            confidence={prof.confidenceScore}
            note="Internal recommendation with guardrails — not a valuation or legal advice."
          />
        ) : (
          <p className="text-sm text-zinc-500">No pricing profile — run engine recompute.</p>
        )}
        <div className="rounded-xl border border-zinc-800 p-3 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-300">Recent history</p>
          <ul className="mt-2 space-y-1">
            {hist.map((h) => (
              <li key={h.id}>
                {h.createdAt.toISOString().slice(0, 10)} → ${Number(h.recommendedPrice).toFixed(0)} · {h.reasonSummary}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </HubLayout>
  );
}
