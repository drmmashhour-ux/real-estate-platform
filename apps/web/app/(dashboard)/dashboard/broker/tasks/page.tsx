import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";
import { BrokerCrmStagingBadge } from "@/components/crm/broker-crm/BrokerCrmStagingBadge";
import { BrokerTasksClient } from "./tasks-client";

export const dynamic = "force-dynamic";

export default async function BrokerTasksPage() {
  const user = await requireBrokerOrAdminPage("/dashboard/broker/tasks");

  return (
    <HubLayout
      title="CRM tasks"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
    >
      <div className="space-y-4 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Follow-ups & tasks</h2>
            <p className="mt-1 text-sm text-slate-400">Open TASK and FOLLOW_UP items with a due date.</p>
          </div>
          <BrokerCrmStagingBadge />
        </div>
        <BrokerTasksClient />
      </div>
    </HubLayout>
  );
}
