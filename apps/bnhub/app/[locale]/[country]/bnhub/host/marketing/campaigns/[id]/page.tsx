import { HostMarketingCampaignDetail } from "@/src/modules/bnhub-marketing/pages/host-marketing-campaign-detail";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HostMarketingCampaignDetail campaignId={id} />;
}
