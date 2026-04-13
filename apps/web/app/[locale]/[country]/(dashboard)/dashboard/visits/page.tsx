import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { BrokerVisitsDashboardClient } from "@/components/visits/BrokerVisitsDashboardClient";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";

export const dynamic = "force-dynamic";

export default async function BrokerVisitsPage() {
  const user = await requireBrokerOrAdminPage("/dashboard/visits");
  const theme = getHubTheme("broker");

  return (
    <HubLayout
      title="Visits"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
      showWorkspaceBadge
      theme={theme}
    >
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-6 text-sm text-slate-400">
          Manage showing requests and confirmed visits. Availability is under{" "}
          <Link className="text-premium-gold hover:underline" href="/dashboard/visits/availability">
            Visit availability
          </Link>
          .
        </p>
        <BrokerVisitsDashboardClient />
      </div>
    </HubLayout>
  );
}
