import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { AdminMarketingCampaigns } from "@/src/modules/bnhub-marketing/pages/admin-marketing-campaigns";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");

  return (
    <HubLayout title="BNHUB Campaigns" hubKey="admin" navigation={hubNavigation.admin}>
      <AdminMarketingCampaigns />
    </HubLayout>
  );
}
