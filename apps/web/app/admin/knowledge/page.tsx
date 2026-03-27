import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { KnowledgeLibraryPage } from "@/src/modules/knowledge/ui/KnowledgeLibraryPage";

export const dynamic = "force-dynamic";

export default async function AdminKnowledgePage() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  return (
    <HubLayout title="Admin" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={true}>
      <KnowledgeLibraryPage />
    </HubLayout>
  );
}
