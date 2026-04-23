import { AppScreen } from "@/components/AppScreen";
import { EmptyState } from "@/components/EmptyState";

export default function SellerDashboardMobile() {
  return (
    <AppScreen>
      <EmptyState title="Seller dashboard" subtitle="Listings, leads, performance, and seller actions." />
    </AppScreen>
  );
}
