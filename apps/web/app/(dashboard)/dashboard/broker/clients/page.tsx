import { HubLayout } from "@/components/hub/HubLayout";
import { getHubTheme } from "@/lib/hub/themes";
import { hubNavigation } from "@/lib/hub/navigation";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";
import { BrokerClientsListClient } from "./clients-list-client";

export const dynamic = "force-dynamic";

export default async function BrokerClientsListPage() {
  const user = await requireBrokerOrAdminPage("/dashboard/broker/clients");
  const theme = getHubTheme("broker");

  return (
    <HubLayout
      title="Clients"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
    >
      <div style={{ ["--hub-accent" as string]: theme.accent }}>
        <BrokerClientsListClient isAdmin={user.role === "ADMIN"} />
      </div>
    </HubLayout>
  );
}
