import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { PartnerOutreachClient } from "./partner-outreach-client";

export const dynamic = "force-dynamic";

export default async function AdminPartnerOutreachPage() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");

  return (
    <HubLayout title="Partner outreach" hubKey="admin" navigation={hubNavigation.admin}>
      <PartnerOutreachClient defaultPlatformUrl={getSiteBaseUrl()} />
    </HubLayout>
  );
}
