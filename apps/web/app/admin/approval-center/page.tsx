import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { ApprovalCenterPage } from "@/src/modules/legal-workflow/ui/ApprovalCenterPage";

export const dynamic = "force-dynamic";

export default async function AdminApprovalCenterPage() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");

  return (
    <HubLayout title="Admin" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={true}>
      <ApprovalCenterPage />
    </HubLayout>
  );
}
