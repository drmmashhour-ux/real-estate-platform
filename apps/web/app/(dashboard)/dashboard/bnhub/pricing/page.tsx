import Link from "next/link";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";

export default async function BNHubPricingPage() {
  const role = await getUserRole();
  const theme = getHubTheme("bnhub");

  return (
    <HubLayout
      title="BNHub"
      hubKey="bnhub"
      navigation={hubNavigation.bnhub}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-6">
        <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
          Update price
        </h1>
        <p className="text-sm opacity-80">
          Adjust nightly rates, minimum stay, and seasonal pricing for your listings. Use the BNHub dashboard to apply AI suggestions.
        </p>
        <Link
          href="/bnhub/host/dashboard"
          className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: theme.accent }}
        >
          Open host dashboard →
        </Link>
        <Link href="/dashboard/bnhub" className="ml-3 inline-block text-sm font-medium opacity-80 hover:underline" style={{ color: theme.accent }}>
          ← Back to BNHub dashboard
        </Link>
      </div>
    </HubLayout>
  );
}
