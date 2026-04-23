import { prisma } from "@repo/db";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";
import { BrokerCrmStagingBadge } from "@/components/crm/broker-crm/BrokerCrmStagingBadge";
import { CrmPipelineViewedTracker } from "@/components/crm/broker-crm/CrmPipelineViewedTracker";
import { PipelineBoardClient } from "./pipeline-board-client";

export const dynamic = "force-dynamic";

export default async function BrokerPipelinePage() {
  const user = await requireBrokerOrAdminPage("/dashboard/broker/pipeline");
  const scope = user.role === "ADMIN" ? {} : { brokerId: user.id };

  const clients = await prisma.brokerClient.findMany({
    where: scope,
    orderBy: { updatedAt: "desc" },
    take: 500,
    include: {
      interactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, type: true },
      },
    },
  });

  return (
    <HubLayout
      title="Pipeline"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
    >
      <CrmPipelineViewedTracker />
      <div className="space-y-4 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Kanban pipeline</h2>
            <p className="mt-1 text-sm text-slate-400">
              Columns mirror CRM stages. Open a card to change status or log work.
            </p>
          </div>
          <BrokerCrmStagingBadge />
        </div>
        <PipelineBoardClient initial={clients} />
      </div>
    </HubLayout>
  );
}
