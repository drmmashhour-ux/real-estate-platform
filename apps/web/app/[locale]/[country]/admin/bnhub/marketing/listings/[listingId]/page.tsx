import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { AdminMarketingListing } from "@/src/modules/bnhub-marketing/pages/admin-marketing-listing";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const { listingId } = await params;

  return (
    <HubLayout title="Listing marketing" hubKey="admin" navigation={hubNavigation.admin}>
      <AdminMarketingListing listingId={listingId} />
    </HubLayout>
  );
}
