import { notFound } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { BrokerCrmLeadDetailClient } from "@/components/broker-crm/BrokerCrmLeadDetailClient";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function InquiryCrmLeadPage(props: Props) {
  const user = await requireBrokerOrAdminPage("/dashboard/crm");
  const { id } = await props.params;

  const lead = await findLeadForBrokerScope(id, user.id, user.role);
  if (!lead) notFound();

  const titleRow = await prisma.lecipmBrokerCrmLead.findUnique({
    where: { id },
    select: { guestName: true, customer: { select: { name: true, email: true } } },
  });
  const heading =
    titleRow?.customer?.name?.trim() || titleRow?.guestName || titleRow?.customer?.email || "Lead detail";

  const theme = getHubTheme("broker");

  return (
    <HubLayout
      title={heading}
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
      showWorkspaceBadge
      theme={theme}
    >
      <div className="mx-auto max-w-5xl px-4 py-6">
        <BrokerCrmLeadDetailClient leadId={id} />
      </div>
    </HubLayout>
  );
}
