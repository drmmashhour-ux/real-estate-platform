

import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { ProjectsDashboardClient } from "./ProjectsDashboardClient";
import { ProjectsTopThreeClient } from "./ProjectsTopThreeClient";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";

/** Projects hub – only layout and theme. Projects data and top 3 load in client. */
export default async function ProjectsHubPage() {
  const role = await getUserRole();
  const theme = getHubTheme("projects");

  return (
    <HubLayout
      title="Projects"
      hubKey="projects"
      navigation={hubNavigation.projects}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-8">
        <ProjectsDashboardClient theme={theme} isAdmin={isHubAdminRole(role)} />
        <ProjectsTopThreeClient />
      </div>
    </HubLayout>
  );
}
