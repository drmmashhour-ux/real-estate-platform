import type { Metadata } from "next";
import { ListingStatus } from "@prisma/client";
import { BnhubMarketingLandingClient } from "@/components/bnhub/BnhubMarketingLandingClient";
import { getGuestId } from "@/lib/auth/session";
import { createReferral } from "@/lib/bnhub/referral";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BNHub — Find safer, smarter stays",
  description:
    "Discover verified short-term stays in Montréal and Laval. Search, compare, and book with confidence.",
};

async function getOrCreateUserReferralCode(referrerId: string): Promise<string> {
  const existing = await prisma.referral.findFirst({
    where: { referrerId, usedByUserId: null },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });
  if (existing?.code) return existing.code;
  const created = await createReferral(referrerId);
  return created.code;
}

export default async function BnhubMarketingLandingPage() {
  const userId = await getGuestId();
  const referralCode = userId ? await getOrCreateUserReferralCode(userId) : null;

  const sampleListing = await prisma.shortTermListing.findFirst({
    where: { listingStatus: ListingStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
    select: { id: true, listingCode: true },
  });
  const listingSlug = sampleListing?.listingCode ?? sampleListing?.id ?? null;
  const exampleListingHref = listingSlug ? `/bnhub/${listingSlug}` : "/en/ca/search/bnhub";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <BnhubMarketingLandingClient
        searchMontrealHref="/en/ca/search/bnhub?location=Montréal"
        searchLavalHref="/en/ca/search/bnhub?location=Laval"
        exampleListingHref={exampleListingHref}
        bookingDemoHref="/bnhub/demo/guest-flow"
        hostOnboardingHref="/bnhub/host/onboarding"
        referralCode={referralCode}
      />
    </main>
  );
}
