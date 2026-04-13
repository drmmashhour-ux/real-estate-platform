import { redirect, notFound } from "next/navigation";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getGuestId } from "@/lib/auth/session";
import { listWorkspaceCases } from "@/lib/trustgraph/application/listWorkspaceCases";
import { isTrustGraphEnabled, isTrustGraphEnterpriseWorkspacesEnabled } from "@/lib/trustgraph/feature-flags";
import { getActiveMembership, roleCanReview } from "@/lib/trustgraph/infrastructure/services/workspaceMembershipService";
import { WorkspaceFilters } from "@/lib/trustgraph/ui/components/WorkspaceFilters";
import { WorkspaceQueueTable } from "@/lib/trustgraph/ui/components/WorkspaceQueueTable";

export const dynamic = "force-dynamic";

export default async function WorkspaceTrustgraphQueuePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/workspaces");

  const { workspaceId } = await params;

  if (!isTrustGraphEnabled() || !isTrustGraphEnterpriseWorkspacesEnabled()) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-neutral-600">Enterprise workspaces are disabled.</p>
      </div>
    );
  }

  const admin = await isPlatformAdmin(userId);
  const member = await getActiveMembership(workspaceId, userId);
  if (!admin && (!member || !roleCanReview(member.role))) notFound();

  const items = await listWorkspaceCases(workspaceId, 100);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Review queue</h1>
      <WorkspaceFilters />
      <WorkspaceQueueTable items={items} />
    </div>
  );
}
