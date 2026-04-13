import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { CaseCommandCenterPage } from "@/src/modules/case-command-center/ui/CaseCommandCenterPage";

export const dynamic = "force-dynamic";

export default async function AdminCaseCommandCenterPage({ params }: { params: Promise<{ documentId: string }> }) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const { documentId } = await params;
  return (
    <HubLayout title="Admin" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={true}>
      <CaseCommandCenterPage documentId={documentId} />
    </HubLayout>
  );
}
