

import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { AlertsClient } from "./AlertsClient";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";

export default async function ProjectsAlertsPage() {
  const role = await getUserRole();
  const theme = getHubTheme("projects");

  return (
    <HubLayout
      title="Projects"
      hubKey="projects"
      navigation={hubNavigation.projects}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">Project Alerts</h1>
        <AlertsClient theme={theme} />
      </div>
    </HubLayout>
  );
}
