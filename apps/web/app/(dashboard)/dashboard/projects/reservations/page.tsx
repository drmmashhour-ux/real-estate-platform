import { getUserRole } from "@/lib/auth/session";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { ReservationsClient } from "./ReservationsClient";

export default async function ProjectsReservationsPage() {
  const role = await getUserRole();
  const theme = getHubTheme("projects");

  return (
    <HubLayout
      title="Projects"
      hubKey="projects"
      navigation={hubNavigation.projects}
      showAdminInSwitcher={role === "admin"}
    >
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">My Reservations</h1>
        <ReservationsClient theme={theme} />
      </div>
    </HubLayout>
  );
}
