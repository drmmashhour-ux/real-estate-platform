import { BNHubPropertyPage } from "@/src/modules/bnhub/ui/BNHubPropertyPage";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BNHubPropertyPage listingId={id} />;
}

