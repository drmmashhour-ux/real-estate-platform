import { AppScreen } from "@/components/AppScreen";
import { EmptyState } from "@/components/EmptyState";

export default function BuyerDashboardMobile() {
  return (
    <AppScreen>
      <EmptyState title="Buyer dashboard" subtitle="Recommendations, saved homes, alerts, and visits." />
    </AppScreen>
  );
}
