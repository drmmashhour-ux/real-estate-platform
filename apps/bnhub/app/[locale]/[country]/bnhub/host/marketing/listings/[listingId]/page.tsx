import { HostMarketingListing } from "@/src/modules/bnhub-marketing/pages/host-marketing-listing";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  return <HostMarketingListing listingId={listingId} />;
}
