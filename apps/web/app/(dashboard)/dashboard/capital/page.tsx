import { HubLayout } from "@/components/layout/HubLayout";
import { CapitalDashboardClient } from "./CapitalDashboardClient";

export const metadata = {
  title: "Capital Allocator | LECIPM",
};

export default function CapitalDashboardPage() {
  return (
    <HubLayout activeSection="CAPITAL">
      <CapitalDashboardClient />
    </HubLayout>
  );
}
