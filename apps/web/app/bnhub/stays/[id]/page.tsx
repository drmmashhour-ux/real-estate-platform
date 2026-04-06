import { BnhubListingView } from "@/app/bnhub/bnhub-listing-view";

export const dynamic = "force-dynamic";

/** Public stay detail — canonical path `/bnhub/stays/[id]` (id or listing code). */
export default async function BnhubStayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <BnhubListingView
      routeLookupKey={id}
      seoCanonicalPath={`/bnhub/stays/${encodeURIComponent(id)}`}
    />
  );
}
