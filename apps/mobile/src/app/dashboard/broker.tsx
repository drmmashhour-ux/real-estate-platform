import { AppScreen } from "@/components/AppScreen";
import { EmptyState } from "@/components/EmptyState";

export default function BrokerDashboardMobile() {
  return (
    <AppScreen>
      <EmptyState title="Broker dashboard" subtitle="Lead pipeline, CRM, and commission tracking." />
    </AppScreen>
  );
}
