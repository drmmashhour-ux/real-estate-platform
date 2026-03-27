import { redirect } from "next/navigation";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { AdminAuditTimelinesPanel } from "./AdminAuditTimelinesPanel";
import { ImmoContactLogsClient } from "./ImmoContactLogsClient";

export const dynamic = "force-dynamic";

export default async function AdminImmoLogsPage() {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    redirect("/admin");
  }
  const theme = getHubTheme("admin");

  return (
    <HubLayout title="Admin" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            ImmoContact compliance log
          </h1>
          <p className="mt-1 text-sm opacity-80">
            Views, contact taps, messages, and booking requests — audit trail for disputes and regulatory review. Retention
            follows your data policy.
          </p>
        </div>
        <AdminAuditTimelinesPanel />
        <ImmoContactLogsClient />
      </div>
    </HubLayout>
  );
}
