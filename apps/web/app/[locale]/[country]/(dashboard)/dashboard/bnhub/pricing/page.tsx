import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@repo/db";

import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { PricingAiSuggestPanel } from "@/components/bnhub/PricingAiSuggestPanel";
import { requireBnhubHostAccess } from "@/lib/host/require-bnhub-host-access";

type Sp = { listingId?: string };

export default async function BNHubPricingPage({ searchParams }: { searchParams: Promise<Sp> }) {
  const role = await getUserRole();
  const theme = getHubTheme("bnhub");
  const sp = await searchParams;
  const initialListingId = typeof sp.listingId === "string" ? sp.listingId : "";

  const userId = await getGuestId();
  const gate = await requireBnhubHostAccess(userId);
  const listings =
    gate.ok === true
      ? await prisma.shortTermListing.findMany({
          where: { ownerId: gate.userId },
          select: { id: true, title: true, city: true },
          orderBy: { updatedAt: "desc" },
          take: 80,
        })
      : [];

  return (
    <HubLayout
      title="BNHUB"
      hubKey="bnhub"
      navigation={hubNavigation.bnhub}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-6">
        <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
          Update price
        </h1>
        <p className="text-sm opacity-80" style={{ color: theme.text }}>
          Adjust nightly rates, minimum stay, and seasonal pricing for your listings. Review transparent suggestions
          below — every factor is explained; you stay in control.
        </p>

        {gate.ok ? (
          <PricingAiSuggestPanel
            listings={listings}
            initialListingId={initialListingId}
            themeAccent={theme.accent}
            themeText={theme.text}
          />
        ) : (
          <p className="text-sm opacity-80" style={{ color: theme.text }}>
            Sign in as a host to load dynamic pricing suggestions.
          </p>
        )}

        <Link
          href="/bnhub/host/dashboard"
          className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: theme.accent }}
        >
          Open host dashboard →
        </Link>
        <Link
          href="/dashboard/bnhub"
          className="ml-3 inline-block text-sm font-medium opacity-80 hover:underline"
          style={{ color: theme.accent }}
        >
          ← Back to BNHUB dashboard
        </Link>
      </div>
    </HubLayout>
  );
}
