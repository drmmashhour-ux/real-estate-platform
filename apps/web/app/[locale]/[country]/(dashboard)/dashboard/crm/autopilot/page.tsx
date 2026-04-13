import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { BrokerAutopilotDashboardClient } from "@/components/broker-autopilot/BrokerAutopilotDashboardClient";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";

export const dynamic = "force-dynamic";

export default async function BrokerAutopilotPage() {
  const user = await requireBrokerOrAdminPage("/dashboard/crm/autopilot");
  const theme = getHubTheme("broker");

  return (
    <HubLayout
      title="CRM Autopilot"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
      showWorkspaceBadge
      theme={theme}
    >
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-6 text-sm text-slate-400">
          <Link className="text-premium-gold hover:underline" href="/dashboard/crm">
            ← Inquiry CRM
          </Link>
          <span className="mx-2 text-slate-600">·</span>
          Suggestions and drafts stay in your control — review, edit, then send from the lead thread.
        </p>
        <BrokerAutopilotDashboardClient />
      </div>
    </HubLayout>
  );
}
