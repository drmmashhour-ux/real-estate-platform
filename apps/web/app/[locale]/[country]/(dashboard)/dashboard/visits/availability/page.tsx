import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { BrokerVisitAvailabilityClient } from "@/components/visits/BrokerVisitAvailabilityClient";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";

export const dynamic = "force-dynamic";

export default async function BrokerVisitAvailabilityPage() {
  const user = await requireBrokerOrAdminPage("/dashboard/visits/availability");
  const theme = getHubTheme("broker");

  return (
    <HubLayout
      title="Visit availability"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
      showWorkspaceBadge
      theme={theme}
    >
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/dashboard/visits" className="text-sm text-premium-gold hover:underline">
          ← Visits
        </Link>
        <BrokerVisitAvailabilityClient />
      </div>
    </HubLayout>
  );
}
