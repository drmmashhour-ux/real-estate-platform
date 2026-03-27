import { redirect, notFound } from "next/navigation";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getGuestId } from "@/lib/auth/session";
import { loadWhiteLabelDashboardForWorkspace } from "@/lib/trustgraph/application/integrations/whiteLabelDashboardIntegration";
import { isTrustGraphEnabled, isTrustGraphWhiteLabelDashboardsEnabled } from "@/lib/trustgraph/feature-flags";
import { getActiveMembership } from "@/lib/trustgraph/infrastructure/services/workspaceMembershipService";
import { BrandingHeader } from "@/lib/trustgraph/ui/components/BrandingHeader";
import { WorkspaceTrustSummaryCards } from "@/lib/trustgraph/ui/components/WorkspaceTrustSummaryCards";

export const dynamic = "force-dynamic";

export default async function WorkspaceTrustgraphDashboardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/workspaces");

  const { workspaceId } = await params;

  if (!isTrustGraphEnabled() || !isTrustGraphWhiteLabelDashboardsEnabled()) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-neutral-600">Enterprise trust dashboards are disabled.</p>
      </div>
    );
  }

  const admin = await isPlatformAdmin(userId);
  const member = await getActiveMembership(workspaceId, userId);
  if (!admin && !member) notFound();

  const dashboard = await loadWhiteLabelDashboardForWorkspace(workspaceId);
  if (!dashboard) notFound();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <BrandingHeader name={dashboard.workspaceName} branding={dashboard.branding} />
      <WorkspaceTrustSummaryCards metrics={dashboard.metrics} />
    </div>
  );
}
