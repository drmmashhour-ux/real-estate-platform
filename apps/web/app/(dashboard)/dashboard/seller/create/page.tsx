import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { SellerListingWizard } from "@/components/seller/SellerListingWizard";
import { getTrustGraphFeatureFlags } from "@/lib/trustgraph/feature-flags";

export const dynamic = "force-dynamic";

export default async function SellerHubCreatePage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/seller/create");

  const tg = getTrustGraphFeatureFlags();

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-slate-100">
      <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading…</div>}>
        <SellerListingWizard
          trustGraph={{ listingBadge: tg.listingBadge, declarationWidget: tg.declarationWidget }}
        />
      </Suspense>
    </main>
  );
}
