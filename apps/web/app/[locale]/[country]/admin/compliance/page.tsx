import { HubLayout } from "@/components/hub/HubLayout";
import { ComplianceCommandCenter } from "@/components/admin-compliance/ComplianceCommandCenter";
import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { hubNavigation } from "@/lib/hub/navigation";
import { loadComplianceCommandCenterPayload } from "@/modules/compliance-admin/compliance-command-center.service";
import type { ComplianceAnalyticsWindow } from "@/modules/compliance-analytics/compliance-analytics.types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminComplianceOverviewPage() {
  const userId = await requireAdminControlUserId();
  if (!complianceAdminFlags.adminComplianceCommandCenterV1) {
    return (
      <HubLayout title="Compliance" hubKey="admin" navigation={hubNavigation.admin}>
        <div className="max-w-2xl space-y-3 text-zinc-400">
          <h1 className="text-xl font-semibold text-white">Compliance command center</h1>
          <p>
            Enable <code className="font-mono text-amber-200/80">FEATURE_ADMIN_COMPLIANCE_COMMAND_CENTER_V1</code> to
            load supervisory queues and analytics.
          </p>
        </div>
      </HubLayout>
    );
  }

  const window: ComplianceAnalyticsWindow = "30d";
  const data = await loadComplianceCommandCenterPayload({
    actorUserId: userId,
    window,
    auditSurface: "overview",
  });

  return (
    <HubLayout title="Compliance command center" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="mx-auto max-w-7xl px-2 py-2 sm:px-4">
        <ComplianceCommandCenter data={data} navActive="/admin/compliance" mode="overview" />
      </div>
    </HubLayout>
  );
}
