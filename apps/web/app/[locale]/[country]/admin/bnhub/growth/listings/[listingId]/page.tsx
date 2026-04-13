import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { evaluateLaunchPolicy } from "@/src/modules/bnhub-growth-engine/policies/growthPolicyService";
import { listGrowthCampaigns } from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";
import { listLeadsByListing } from "@/src/modules/bnhub-growth-engine/services/leadEngineService";
import { prisma } from "@/lib/db";
import type { ClassificationBreakdown } from "@/src/modules/bnhub-growth-engine/services/propertyClassificationService";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const { listingId } = await params;
  const [policy, allCampaigns, leads, classification] = await Promise.all([
    evaluateLaunchPolicy(listingId),
    listGrowthCampaigns({ take: 100 }),
    listLeadsByListing(listingId),
    prisma.bnhubPropertyClassification.findUnique({ where: { listingId } }),
  ]);
  const campaigns = allCampaigns.filter((c) => c.listingId === listingId);
  const breakdown: ClassificationBreakdown | null =
    classification?.breakdownJson && typeof classification.breakdownJson === "object"
      ? (classification.breakdownJson as ClassificationBreakdown)
      : null;

  return (
    <HubLayout title="Listing growth" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4 text-white">
        <Link href="/admin/bnhub/growth" className="text-sm text-amber-400">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-bold">Listing {listingId}</h1>
        <div className="rounded-2xl border border-zinc-800 p-4">
          <p className="text-sm font-semibold text-amber-400">Launch policy</p>
          <p className="text-sm text-zinc-400">{policy.allowed ? "Allowed" : "Blocked"}</p>
          <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
            {policy.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
            <p>
              Premium campaign star gate (4★+):{" "}
              <span className="text-zinc-200">{policy.flags.bnhubStarPremiumEligible ? "yes" : "no"}</span>
            </p>
            <p>
              Luxury category (5★):{" "}
              <span className="text-zinc-200">{policy.flags.bnhubLuxuryCategoryEligible ? "yes" : "no"}</span>
            </p>
          </div>
        </div>
        {breakdown ? (
          <div className="rounded-2xl border border-zinc-800 p-4">
            <p className="text-sm font-semibold text-amber-400">BNHUB star estimate (admin)</p>
            <p className="mt-1 text-xs text-zinc-500">{breakdown.label}</p>
            <p className="mt-2 text-sm text-zinc-200">
              {breakdown.starRating}★ · {breakdown.overallScore}/100 (base {breakdown.baseScore}, AI{" "}
              {breakdown.aiAdjustment.value >= 0 ? "+" : ""}
              {breakdown.aiAdjustment.value})
            </p>
            <ul className="mt-2 grid gap-1 text-xs text-zinc-400 sm:grid-cols-2">
              <li>Amenities {breakdown.amenities.earned}/{breakdown.amenities.max}</li>
              <li>Comfort {breakdown.comfort.earned}/{breakdown.comfort.max}</li>
              <li>Services {breakdown.services.earned}/{breakdown.services.max}</li>
              <li>Safety {breakdown.safety.earned}/{breakdown.safety.max}</li>
              <li>Completeness {breakdown.completeness.earned}/{breakdown.completeness.max}</li>
              <li>Luxury {breakdown.luxury.earned}/{breakdown.luxury.max}</li>
            </ul>
            {breakdown.improvementSuggestions?.length ? (
              <div className="mt-3 border-t border-zinc-800 pt-3">
                <p className="text-xs font-medium text-emerald-400">Suggestions</p>
                <ul className="mt-1 list-inside list-disc text-xs text-zinc-500">
                  {breakdown.improvementSuggestions.map((s: string) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-zinc-600">No classification row yet — save the listing or call the classification API.</p>
        )}
        <h2 className="text-lg font-semibold">Campaigns</h2>
        <ul className="text-sm text-zinc-300">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link className="text-amber-400" href={`/admin/bnhub/growth/campaigns/${c.id}`}>
                {c.campaignName}
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="text-lg font-semibold">Leads</h2>
        <p className="text-sm text-zinc-500">{leads.length} rows</p>
      </div>
    </HubLayout>
  );
}
