import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { getApprovedHost, hasAcceptedHostAgreement } from "@/lib/bnhub/host";
import { requirePlatformAcceptance, requireBnhubHostAgreement } from "@/lib/legal/require-acceptance";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { HostCreateListingForm } from "./host-create-listing-form";

export default async function BNHubHostNewListingPage() {
  const role = await getUserRole();
  const theme = getHubTheme("bnhub");
  const userId = await getGuestId();
  const ownerId =
    userId ?? process.env.NEXT_PUBLIC_DEMO_HOST_ID ?? null;

  if (!ownerId) {
    redirect("/bnhub/login");
  }

  await requirePlatformAcceptance(ownerId);
  await requireBnhubHostAgreement(ownerId);

  const host = await getApprovedHost(ownerId);
  if (!host) {
    redirect("/bnhub/become-host");
  }

  const agreementAccepted = await hasAcceptedHostAgreement(host.id);
  if (!agreementAccepted) {
    redirect("/bnhub/host-agreement");
  }

  return (
    <HubLayout
      title="BNHub"
      hubKey="bnhub"
      navigation={hubNavigation.bnhub}
      showAdminInSwitcher={role === "admin"}
      quickActions={
        <div className="flex gap-2">
          <Link
            href="/dashboard/bnhub/host"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium opacity-80 hover:underline"
            style={{ color: theme.accent }}
          >
            ← Back
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            Create new listing
          </h1>
          <p className="text-sm opacity-80">
            Add your property details. Only approved hosts can create listings.
          </p>
        </div>

        <HostCreateListingForm />
      </div>
    </HubLayout>
  );
}
