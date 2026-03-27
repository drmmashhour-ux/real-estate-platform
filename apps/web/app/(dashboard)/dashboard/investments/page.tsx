

import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { InvestmentsDashboardClient } from "./InvestmentsDashboardClient";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";

export default async function InvestmentsHubPage() {
  const role = await getUserRole();
  const theme = getHubTheme("investments");

  return (
    <HubLayout
      title="Investments"
      hubKey="investments"
      navigation={hubNavigation.investments}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-8">
        <InvestmentsDashboardClient theme={theme} />
      </div>
    </HubLayout>
  );
}
