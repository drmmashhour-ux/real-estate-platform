import { notFound } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";
import { roleHasPermission } from "@/modules/enterprise/domain/workspacePermissions";
import { WorkspaceOverviewDashboard } from "@/components/enterprise/WorkspaceOverviewDashboard";

export default async function EnterpriseWorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { userId } = await requireAuthenticatedUser();
  const auth = await requireWorkspacePermission(prisma, {
    userId,
    workspaceId,
    permission: "view_internal_analytics",
  });
  if (!auth.ok) notFound();

  const canViewAudit = auth.isPlatformAdmin || roleHasPermission(auth.role, "manage_workspace");

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
        <WorkspaceOverviewDashboard workspaceId={workspaceId} canViewAudit={canViewAudit} />
      </div>
    </div>
  );
}
