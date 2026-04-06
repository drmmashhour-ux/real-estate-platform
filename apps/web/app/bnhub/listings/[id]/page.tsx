import { BnhubListingView } from "@/app/bnhub/bnhub-listing-view";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BnhubListingView routeLookupKey={id} seoCanonicalPath={`/bnhub/listings/${encodeURIComponent(id)}`} />;
}

