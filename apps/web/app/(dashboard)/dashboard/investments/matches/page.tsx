import { getUserRole } from "@/lib/auth/session";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { InvestmentsDashboardClient } from "../InvestmentsDashboardClient";

export default async function MatchesPage() {
  const role = await getUserRole();
  const theme = getHubTheme("investments");
  return (
    <HubLayout title="Investments" hubKey="investments" navigation={hubNavigation.investments} showAdminInSwitcher={role === "admin"}>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">Matched Projects</h1>
        <InvestmentsDashboardClient theme={theme} />
      </div>
    </HubLayout>
  );
}
