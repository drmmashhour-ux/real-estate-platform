import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { SellerListingWizard } from "@/components/seller/SellerListingWizard";
import { getTrustGraphFeatureFlags } from "@/lib/trustgraph/feature-flags";

export const dynamic = "force-dynamic";

export default async function SellerCreateListingPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/seller/create-listing");

  const tg = getTrustGraphFeatureFlags();

  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading…</div>}>
      <SellerListingWizard
        createPath="/seller/create-listing"
        dashboardHref="/seller/dashboard"
        listingsHref="/seller/dashboard"
        pageTitle="Create listing"
        trustGraph={{ listingBadge: tg.listingBadge, declarationWidget: tg.declarationWidget }}
      />
    </Suspense>
  );
}
