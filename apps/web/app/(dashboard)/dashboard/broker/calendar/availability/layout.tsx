import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";

export const dynamic = "force-dynamic";

export default async function BrokerAvailabilityLayout({ children }: { children: React.ReactNode }) {
  await requireBrokerOrAdminPage("/dashboard/broker/calendar/availability");
  return children;
}
