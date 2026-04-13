import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BrokerAvailabilityLayout({ children }: { children: React.ReactNode }) {
  await requireBrokerOrAdminPage("/dashboard/broker/calendar/availability");
  return children;
}
