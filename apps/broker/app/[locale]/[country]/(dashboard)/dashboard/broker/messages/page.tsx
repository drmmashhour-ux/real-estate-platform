import Link from "next/link";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { BrokerMessagesClient } from "./BrokerMessagesClient";

export default async function BrokerMessagesPage() {
  const role = await getUserRole();
  const theme = getHubTheme("broker");
  return (
    <HubLayout
      title="Broker"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/broker" className="text-sm text-emerald-400 hover:text-emerald-300">← Broker dashboard</Link>
          <h1 className="mt-2 text-xl font-semibold" style={{ color: theme.text }}>Broker-to-broker messaging</h1>
          <p className="mt-1 text-sm text-slate-400">Message other brokers to collaborate on listings and leads.</p>
        </div>
        <BrokerMessagesClient />
      </div>
    </HubLayout>
  );
}
