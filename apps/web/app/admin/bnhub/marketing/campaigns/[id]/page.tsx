import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { AdminMarketingCampaignDetail } from "@/src/modules/bnhub-marketing/pages/admin-marketing-campaign-detail";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const { id } = await params;

  return (
    <HubLayout title="Campaign detail" hubKey="admin" navigation={hubNavigation.admin}>
      <AdminMarketingCampaignDetail campaignId={id} />
    </HubLayout>
  );
}
