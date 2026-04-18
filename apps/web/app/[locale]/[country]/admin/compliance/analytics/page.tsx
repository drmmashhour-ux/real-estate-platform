import { HubLayout } from "@/components/hub/HubLayout";
import { ComplianceCommandCenter } from "@/components/admin-compliance/ComplianceCommandCenter";
import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { hubNavigation } from "@/lib/hub/navigation";
import { loadComplianceCommandCenterPayload } from "@/modules/compliance-admin/compliance-command-center.service";
import type { ComplianceAnalyticsWindow } from "@/modules/compliance-analytics/compliance-analytics.types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminComplianceAnalyticsPage() {
  const userId = await requireAdminControlUserId();
  if (!complianceAdminFlags.adminComplianceCommandCenterV1) {
    return (
      <HubLayout title="Compliance analytics" hubKey="admin" navigation={hubNavigation.admin}>
        <p className="text-zinc-400">Compliance analytics require the command center flag.</p>
      </HubLayout>
    );
  }

  const window: ComplianceAnalyticsWindow = "30d";
  const data = await loadComplianceCommandCenterPayload({
    actorUserId: userId,
    window,
    auditSurface: "analytics",
  });

  return (
    <HubLayout title="Compliance analytics" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="mx-auto max-w-7xl px-2 py-2 sm:px-4">
        <ComplianceCommandCenter data={data} navActive="/admin/compliance/analytics" mode="analytics" />
      </div>
    </HubLayout>
  );
}
