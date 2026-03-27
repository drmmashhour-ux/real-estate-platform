import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { deriveIllustrativeListPriceUsd } from "@/modules/ai-deal-analyzer/services/map-listing-to-input";
import { getListingById } from "@/lib/bnhub/listings";
import { OfferForm } from "@/components/offers/OfferForm";

const DEMO_NIGHT_CENTS: Record<string, number> = {
  "1": 20000,
  "test-listing-1": 20000,
  "demo-listing-montreal": 12500,
};

export const dynamic = "force-dynamic";

export default async function ListingOfferPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuthenticatedUser();
  const { id } = await params;

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
      <OfferForm listingId={id} defaultOfferPriceUsd={defaultOfferPriceUsd} />
    </main>
  );
}
