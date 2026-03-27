import Link from "next/link";
import { getUserRole } from "@/lib/auth/session";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { FavoritesClient } from "./FavoritesClient";

export default async function ProjectsFavoritesPage() {
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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Favorite Projects</h1>
          <Link
            href="/projects"
            className="text-sm font-medium text-teal-400 hover:text-teal-300"
          >
            Browse projects →
          </Link>
        </div>
        <FavoritesClient theme={theme} />
      </div>
    </HubLayout>
  );
}
