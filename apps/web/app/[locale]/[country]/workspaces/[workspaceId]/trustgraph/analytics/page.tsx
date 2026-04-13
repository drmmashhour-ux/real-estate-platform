import { redirect, notFound } from "next/navigation";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getGuestId } from "@/lib/auth/session";
import { loadWorkspacePortfolioAnalytics } from "@/lib/trustgraph/application/integrations/portfolioAnalyticsIntegration";
import { isTrustGraphEnabled, isTrustGraphPortfolioAnalyticsEnabled } from "@/lib/trustgraph/feature-flags";
import { getActiveMembership, roleCanReview } from "@/lib/trustgraph/infrastructure/services/workspaceMembershipService";
import { PortfolioHealthCards } from "@/lib/trustgraph/ui/components/PortfolioHealthCards";

export const dynamic = "force-dynamic";

export default async function WorkspaceTrustgraphAnalyticsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/workspaces");

  const { workspaceId } = await params;

  if (!isTrustGraphEnabled() || !isTrustGraphPortfolioAnalyticsEnabled()) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-neutral-600">Portfolio analytics are disabled.</p>
      </div>
    );
  }

  const admin = await isPlatformAdmin(userId);
  const member = await getActiveMembership(workspaceId, userId);
  if (!admin && (!member || !roleCanReview(member.role))) notFound();

  const data = await loadWorkspacePortfolioAnalytics(workspaceId, {});

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Portfolio trust</h1>
      <PortfolioHealthCards data={data} />
    </div>
  );
}
