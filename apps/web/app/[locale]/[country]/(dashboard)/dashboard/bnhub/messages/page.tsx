import Link from "next/link";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";

export default async function BNHubMessagesPage() {
  const role = await getUserRole();
  const theme = getHubTheme("bnhub");

  return (
    <HubLayout
      title="BNHUB"
      hubKey="bnhub"
      navigation={hubNavigation.bnhub}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-6">
        <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
          Message guest
        </h1>
        <p className="text-sm opacity-80">
          Communicate with guests before and during their stay. Open the messages inbox to view and reply.
        </p>
        <Link
          href="/messages"
          className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: theme.accent }}
        >
          Open messages →
        </Link>
        <Link href="/dashboard/bnhub" className="ml-3 inline-block text-sm font-medium opacity-80 hover:underline" style={{ color: theme.accent }}>
          ← Back to BNHUB dashboard
        </Link>
      </div>
    </HubLayout>
  );
}
