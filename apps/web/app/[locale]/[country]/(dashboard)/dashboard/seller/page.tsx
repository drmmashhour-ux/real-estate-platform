import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { fsboListingLifecycleUx } from "@/lib/fsbo/listing-verification";
import { SellerHubAiSection } from "@/components/ai/SellerHubAiSection";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";
import { ListingAiScoresCard } from "@/components/seller/ListingAiScoresCard";
import { SellerDashboardTrustOverview } from "@/components/seller/SellerDashboardTrustOverview";
import { HubJourneyBanner } from "@/components/journey/HubJourneyBanner";
import { legalHubFlags } from "@/config/feature-flags";
import { LegalHubEntryCard } from "@/components/legal/LegalHubEntryCard";
import { GreenUpgradeJourneySection } from "@/components/seller/GreenUpgradeJourney";
import { isSubsidyPipelineStage } from "@/modules/green-ai/pipeline/upgrade-flow";

export const dynamic = "force-dynamic";

function badgeClass(ux: ReturnType<typeof fsboListingLifecycleUx>) {
  if (ux === "active") return "bg-emerald-500/20 text-emerald-300";
  if (ux === "draft") return "bg-slate-600/40 text-slate-300";
  if (ux === "rejected") return "bg-red-500/20 text-red-300";
  return "bg-amber-500/20 text-amber-200";
}

function badgeLabel(ux: ReturnType<typeof fsboListingLifecycleUx>) {
  if (ux === "active") return "ACTIVE";
  if (ux === "draft") return "DRAFT";
  if (ux === "rejected") return "REJECTED";
  return "PENDING_VERIFICATION";
}

export default async function SellerHubDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/seller");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { marketplacePersona: true, sellerPlan: true, role: true, name: true, sellerProfileAddress: true },
  });

  const listings = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      city: true,
      status: true,
      moderationStatus: true,
      listingCode: true,
      updatedAt: true,
      riskScore: true,
      trustScore: true,
      aiScoreReasonsJson: true,
      verification: true,
    },
  });

  const pendingDocs = await prisma.fsboListingDocument.count({
    where: {
      fsboListing: { ownerId: userId },
      OR: [{ status: "missing" }, { fileUrl: null }],
    },
  });

  const pendingContracts = await prisma.contract.count({
    where: { userId, fsboListingId: { not: null }, status: { not: "signed" } },
  });

  const supportingDocCount = await prisma.sellerSupportingDocument.count({
    where: { userId },
  });

  const leadsActivity = await prisma.fsboLead.count({
    where: { listing: { ownerId: userId } },
  });

  const withTrust = listings.filter((l) => l.trustScore != null);
  const avgTrust =
    withTrust.length > 0
      ? Math.round(withTrust.reduce((a, l) => a + (l.trustScore ?? 0), 0) / withTrust.length)
      : null;

  const verifiedCount = listings.filter((l) => l.verification?.identityStatus === "VERIFIED").length;
  const verifiedPct = listings.length > 0 ? Math.round((100 * verifiedCount) / listings.length) : 0;

  let actionRequired = pendingDocs + pendingContracts;
  for (const l of listings) {
    const ux = fsboListingLifecycleUx(l.status, l.moderationStatus, l.verification);
    if (ux !== "active" && ux !== "draft") actionRequired += 1;
  }

  const issueRows: { id: string; title: string; detail: string; href: string }[] = [];
  const seen = new Set<string>();
  outer: for (const l of listings) {
    const reasons = Array.isArray(l.aiScoreReasonsJson)
      ? l.aiScoreReasonsJson.filter((x): x is string => typeof x === "string")
      : [];
    for (const r of reasons) {
      const key = `${l.id}:${r.slice(0, 120)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issueRows.push({
        id: key,
        title: l.title,
        detail: r,
        href: `/dashboard/seller/listings/${l.id}`,
      });
      if (issueRows.length >= 8) break outer;
    }
  }
  if (pendingDocs > 0 && issueRows.length < 8) {
    issueRows.push({
      id: "issue-docs",
      title: "Documents",
      detail: `${pendingDocs} pending upload(s) or missing file(s)`,
      href: "/dashboard/seller/documents",
    });
  }
  if (pendingContracts > 0 && issueRows.length < 8) {
    issueRows.push({
      id: "issue-contracts",
      title: "Contracts",
      detail: `${pendingContracts} agreement(s) not signed yet`,
      href: "/dashboard/seller/contracts",
    });
  }

  const firstName = user?.name?.trim()?.split(/\s+/)[0] ?? "";

  const tableRows = listings.map((l) => {
    const ux = fsboListingLifecycleUx(l.status, l.moderationStatus, l.verification);
    return {
      id: l.id,
      title: l.title,
      city: l.city,
      updatedAt: l.updatedAt.toLocaleDateString(),
      listingCode: l.listingCode,
      uxLabel: badgeLabel(ux),
      uxBadgeClass: badgeClass(ux),
      trustScore: l.trustScore,
    };
  });

  const primaryListing = listings[0];
  const sellerDecision = await safeEvaluateDecision({
    hub: "seller",
    userId,
    userRole: user?.role ?? "USER",
    entityType: primaryListing ? "listing" : "platform",
    entityId: primaryListing?.id ?? null,
    listingVariant: primaryListing ? "fsbo" : undefined,
  });

  return (
    <main className="dashboard-shell">
      <div className="mx-auto max-w-6xl space-y-10">
        <HubJourneyBanner hub="seller" locale={locale} country={country} userId={userId} />
        <GreenUpgradeJourneySection
          locale={locale}
          country={country}
          listingId={primaryListing?.id ?? null}
          listingTitle={primaryListing?.title ?? null}
          stage={greenStage}
          estimatedGrantCad={greenProject?.estimatedGrant ?? null}
        />
        {legalHubFlags.legalHubV1 ? (
          <LegalHubEntryCard href={`/${locale}/${country}/legal`} locale={locale} country={country} />
        ) : null}
        <SellerDashboardTrustOverview
          firstName={firstName}
          stats={{
            avgTrust,
            verifiedPct,
            actionRequired,
            leadsActivity,
          }}
          listings={tableRows}
          issues={issueRows}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[#A1A1A1]">
          <p>
            Plan: <span className="font-medium text-premium-gold">{user?.sellerPlan ?? "basic"}</span>
            {" · "}
            Role: <span className="text-white">{user?.role ?? "—"}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/seller/listings" className="text-premium-gold hover:underline">
              All listings
            </Link>
            <Link href="/dashboard/seller/performance" className="text-premium-gold hover:underline">
              Performance
            </Link>
            <Link href="/dashboard/seller/revenue" className="text-premium-gold hover:underline">
              Revenue
            </Link>
            {user?.sellerProfileAddress ? (
              <span className="text-slate-500">Profile address on file</span>
            ) : (
              <Link href="/onboarding/seller" className="text-amber-200/90 hover:underline">
                Complete seller onboarding
              </Link>
            )}
          </div>
        </div>

        <div className="mt-8">
          <DecisionCard
            title="AI Readiness Score"
            result={sellerDecision}
            actionHref={primaryListing ? `/dashboard/seller/listings/${primaryListing.id}` : "/dashboard/seller/create"}
            actionLabel={primaryListing ? "Review listing" : "Create listing"}
          />
        </div>

        {primaryListing && primaryListing.riskScore != null && primaryListing.trustScore != null ? (
          <section className="card-premium p-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">Risk &amp; trust (primary listing)</h2>
            <p className="mt-1 text-sm text-premium-secondary">
              Based on your declaration, documents, and verification — informational only.
            </p>
            <div className="mt-4">
              <ListingAiScoresCard
                compact
                scores={{
                  riskScore: primaryListing.riskScore,
                  trustScore: primaryListing.trustScore,
                  reasons: Array.isArray(primaryListing.aiScoreReasonsJson)
                    ? primaryListing.aiScoreReasonsJson.filter((x): x is string => typeof x === "string")
                    : [],
                }}
              />
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/seller/documents"
            className="card-premium block p-6 no-underline transition duration-300 hover:no-underline"
          >
            <p className="section-title">Pending documents</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-premium-gold">{pendingDocs}</p>
            <p className="mt-2 text-xs text-premium-secondary">Ownership, ID, optional tax / certificates</p>
          </Link>
          <Link
            href="/dashboard/seller/contracts"
            className="card-premium block p-6 no-underline transition duration-300 hover:no-underline"
          >
            <p className="section-title">Pending contracts</p>
            <p className="mt-3 font-serif text-3xl font-semibold text-premium-gold">{pendingContracts}</p>
            <p className="mt-2 text-xs text-premium-secondary">Seller agreement & platform terms</p>
          </Link>
        </div>

        <section className="card-premium p-6">
          <h2 className="text-lg font-semibold tracking-tight text-white">Documents &amp; Proof (Seller)</h2>
          <p className="mt-2 text-sm leading-relaxed text-premium-secondary">
            Upload all supporting documents required for transparency and verification
          </p>
          <p className="mt-4 font-serif text-2xl font-semibold text-premium-gold">{supportingDocCount}</p>
          <p className="mt-1 text-xs text-premium-secondary">Supporting files on record (by category)</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/seller/documents"
              className="rounded-xl bg-premium-gold px-4 py-2.5 text-center text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold"
            >
              Manage documents
            </Link>
            {primaryListing ? (
              <Link
                href={`/dashboard/seller/listings/${primaryListing.id}`}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm text-slate-200 hover:bg-white/5"
              >
                Primary listing · {primaryListing.title}
              </Link>
            ) : null}
          </div>
        </section>

        <SellerHubAiSection pendingDocs={pendingDocs} pendingContracts={pendingContracts} />

        <p className="text-center text-xs text-premium-secondary">
          AI suggestions and platform checks do not replace legal advice.{" "}
          <Link href="/listings" className="font-medium text-premium-gold hover:text-premium-gold-hover hover:underline">
            Browse public listings
          </Link>
        </p>
      </div>
    </main>
  );
}
