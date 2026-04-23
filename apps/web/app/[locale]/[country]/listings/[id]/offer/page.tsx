import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { deriveIllustrativeListPriceUsd } from "@/modules/ai-deal-analyzer/services/map-listing-to-input";
import { getListingById } from "@/lib/bnhub/listings";
import { OfferForm } from "@/components/offers/OfferForm";
import { PrivacyConsentService } from "@/modules/privacy/services/privacy-consent.service";
import { PrivacyPurpose } from "@prisma/client";
import { OfferFormWrapper } from "@/components/offers/OfferFormWrapper";

const DEMO_NIGHT_CENTS: Record<string, number> = {
  "1": 20000,
  "test-listing-1": 20000,
  "demo-listing-montreal": 12500,
};

export const dynamic = "force-dynamic";

export default async function ListingOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuthenticatedUser();
  const { id } = await params;

  // Check for existing consent
  const hasConsent = await PrivacyConsentService.hasActiveConsent({
    userId,
    purpose: PrivacyPurpose.TRANSACTION_EXECUTION,
  });

  let defaultOfferPriceUsd: number | null = null;
  const demoCents = DEMO_NIGHT_CENTS[id];
  if (demoCents != null) {
    defaultOfferPriceUsd = deriveIllustrativeListPriceUsd(demoCents).usd;
  } else {
    const row = await getListingById(id);
    if (row?.nightPriceCents) {
      defaultOfferPriceUsd = deriveIllustrativeListPriceUsd(row.nightPriceCents).usd;
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] px-4 py-10 text-white">
      <OfferFormWrapper 
        userId={userId} 
        listingId={id} 
        defaultOfferPriceUsd={defaultOfferPriceUsd} 
        initialHasConsent={hasConsent} 
      />
    </main>
  );
}
