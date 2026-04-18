import { HubLayout } from "@/components/hub/HubLayout";
import { ComplianceCommandCenter } from "@/components/admin-compliance/ComplianceCommandCenter";
import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { hubNavigation } from "@/lib/hub/navigation";
import { loadComplianceCommandCenterPayload } from "@/modules/compliance-admin/compliance-command-center.service";
import type { ComplianceAnalyticsWindow } from "@/modules/compliance-analytics/compliance-analytics.types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminComplianceReviewsPage() {
  const userId = await requireAdminControlUserId();
  if (!complianceAdminFlags.brokerageQaReviewV1) {
    return (
      <HubLayout title="QA reviews" hubKey="admin" navigation={hubNavigation.admin}>
        <p className="text-zinc-400">
          Enable <code className="font-mono text-amber-200/80">FEATURE_BROKERAGE_QA_REVIEW_V1</code> for this workspace.
        </p>
      </HubLayout>
    );
  }

  const window: ComplianceAnalyticsWindow = "30d";
  const data = await loadComplianceCommandCenterPayload({
    actorUserId: userId,
    window,
    auditSurface: "reviews",
  });

  return (
    <HubLayout title="Brokerage QA reviews" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="mx-auto max-w-7xl px-2 py-2 sm:px-4">
        <ComplianceCommandCenter data={data} navActive="/admin/compliance/reviews" mode="reviews" />
      </div>
    </HubLayout>
  );
}
