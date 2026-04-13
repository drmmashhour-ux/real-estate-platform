import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { BrokerCrmHomeClient } from "@/components/broker-crm/BrokerCrmHomeClient";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";

export const dynamic = "force-dynamic";

export default async function InquiryCrmDashboardPage() {
  const user = await requireBrokerOrAdminPage("/dashboard/crm");
  const theme = getHubTheme("broker");

  return (
    <HubLayout
      title="Inquiry CRM"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
      showWorkspaceBadge
      theme={theme}
    >
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-6 text-sm text-slate-400">
          Listing inquiries and AI-assisted follow-up. Classic broker workspace remains under{" "}
          <Link className="text-premium-gold hover:underline" href="/dashboard/broker/crm">
            Broker CRM
          </Link>
          .
        </p>
        <BrokerCrmHomeClient />
      </div>
    </HubLayout>
  );
}
