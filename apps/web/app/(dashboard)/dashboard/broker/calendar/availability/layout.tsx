import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";

export { dynamic, revalidate } from "@/lib/auth/protected-route-segment";

export default async function BrokerAvailabilityLayout({ children }: { children: React.ReactNode }) {
  await requireBrokerOrAdminPage("/dashboard/broker/calendar/availability");
  return children;
}
