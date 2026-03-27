import Link from "next/link";
import { getUserRole } from "@/lib/auth/session";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";

export default async function BNHubBookingsPage() {
  const role = await getUserRole();
  const theme = getHubTheme("bnhub");

  return (
    <HubLayout
      title="BNHub"
      hubKey="bnhub"
      navigation={hubNavigation.bnhub}
      showAdminInSwitcher={role === "admin"}
    >
      <div className="space-y-6">
        <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
          Manage bookings
        </h1>
        <p className="text-sm opacity-80">
          View and manage your short-term rental bookings, check-in/check-out, and guest messages.
        </p>
        <Link
          href="/bnhub/host/dashboard"
          className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: theme.accent }}
        >
          Open host dashboard →
        </Link>
        <Link href="/bnhub/trips" className="ml-3 inline-block text-sm font-medium opacity-80 hover:underline" style={{ color: theme.accent }}>
          My trips (as guest)
        </Link>
      </div>
    </HubLayout>
  );
}
