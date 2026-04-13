import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";
import { roleHasPermission } from "@/modules/enterprise/domain/workspacePermissions";
import { WorkspaceTeamShell } from "@/components/lecipm-enterprise/WorkspaceTeamShell";

export default async function WorkspaceTeamPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { userId } = await requireAuthenticatedUser();
  const auth = await requireWorkspacePermission(prisma, {
    userId,
    workspaceId,
    permission: "view_internal_analytics",
  });
  if (!auth.ok) notFound();

  const ws = await prisma.enterpriseWorkspace.findUnique({
    where: { id: workspaceId },
    select: { name: true, settings: true },
  });
  if (!ws) notFound();

  const settings =
    ws.settings && typeof ws.settings === "object" && !Array.isArray(ws.settings)
      ? (ws.settings as Record<string, unknown>)
      : null;

  const canManageMembers = auth.isPlatformAdmin || roleHasPermission(auth.role, "manage_members");
  const canEditOrg = auth.isPlatformAdmin || roleHasPermission(auth.role, "manage_workspace");

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
        <WorkspaceTeamShell
          workspaceId={workspaceId}
          initialName={ws.name}
          initialSettings={settings}
          canManageMembers={canManageMembers}
          canEditOrg={canEditOrg}
        />
      </div>
    </div>
  );
}
