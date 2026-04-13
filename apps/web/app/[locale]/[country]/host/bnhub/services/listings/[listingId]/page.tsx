import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  redirect(`/bnhub/host/services/listings/${listingId}`);
}
