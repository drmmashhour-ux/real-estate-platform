import Link from "next/link";
import { getUserRole } from "@/lib/auth/session";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createListing } from "@/lib/bnhub/listings";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { HubLayout } from "@/components/hub/HubLayout";
import { PremiumSectionCard } from "@/components/hub/PremiumSectionCard";
import { HubQuickActionsRow } from "@/components/hub/HubQuickActionsRow";
import { BNHubDashboardData } from "./components/BNHubDashboardData";
import { BNHubDashboardClient } from "./components/BNHubDashboardClient";
import { InboxSummaryCards } from "@/components/notifications/InboxSummaryCards";

/** BNHub – only layout and theme. AI pricing loads via client fetch. */
export default async function BNHubDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ ownerId?: string }>;
}) {
  const role = await getUserRole();
  const theme = getHubTheme("bnhub");

  // Demo usability: if the host has no published listings yet, seed one so
  // the dashboard doesn't look empty.
  const sp = searchParams ? await searchParams : {};
  const ownerIdFromQuery = sp.ownerId ?? null;
  const guestId = await getGuestId();
  const ownerId =
    ownerIdFromQuery ?? guestId ?? process.env.NEXT_PUBLIC_DEMO_HOST_ID ?? null;

  let showAddFirstListing = false;
  if (ownerId) {
    const listingCount = await prisma.shortTermListing.count({
      where: { ownerId, listingStatus: "PUBLISHED" },
    });
    if (listingCount === 0) {
      showAddFirstListing = true;

      const existing = await prisma.shortTermListing.findFirst({
        where: { ownerId, title: "Luxury Apartment Montreal" },
        select: { id: true },
      });

      if (!existing) {
        await createListing({
          ownerId,
          title: "Luxury Apartment Montreal",
          description: "Demo listing for BNHub host system.",
          propertyType: "Apartment",
          roomType: "Entire place",
          category: "Vacation rental",
          address: "1500 Rue Sherbrooke Ouest",
          city: "Montreal",
          region: "Quebec",
          country: "CA",
          nightPriceCents: 12000,
          beds: 2,
          baths: 1,
          maxGuests: 4,
          photos: [],
          listingStatus: "PUBLISHED",
        });
      }
    }
  }

  return (
    <HubLayout
      title="BNHub"
      hubKey="bnhub"
      navigation={hubNavigation.bnhub}
      showAdminInSwitcher={role === "admin"}
      quickActions={
        <HubQuickActionsRow
          accent={theme.accent}
          actions={[
            { label: "Manage booking", href: "/dashboard/bnhub/bookings" },
            { label: "Rental contracts", href: "/dashboard/contracts" },
            { label: "Update price", href: "/dashboard/bnhub/pricing" },
            { label: "Message guest", href: "/dashboard/bnhub/messages" },
            { label: "View calendar", href: "/dashboard/bnhub/calendar" },
          ]}
        />
      }
    >
      <div className="space-y-8">
        {showAddFirstListing ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
              Start hosting
            </h2>
            <p className="mt-2 text-sm opacity-80">
              Add your first listing to start receiving bookings.
            </p>
            <Link
              href="/dashboard/bnhub/host/new"
              className="mt-4 inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: theme.accent }}
            >
              Add your first listing
            </Link>
          </section>
        ) : null}
        {guestId ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold" style={{ color: theme.text }}>
              Inbox
            </h2>
            <InboxSummaryCards userId={guestId} />
          </section>
        ) : null}
        <BNHubDashboardData theme={theme} />

        <BNHubDashboardClient theme={theme} />

        {/* Pricing tools & upcoming guests */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PremiumSectionCard title="Pricing tools" theme={theme} accent={theme.accent}>
            <p className="text-sm opacity-80">Adjust nightly rates, min stay, and seasonal rules from your host dashboard.</p>
            <Link href="/dashboard/bnhub/pricing" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: theme.accent }}>
              Open pricing →
            </Link>
          </PremiumSectionCard>
          <PremiumSectionCard title="Upcoming guests" theme={theme} accent={theme.accent}>
            <p className="text-sm opacity-80">Check-in and check-out schedule, messages, and keys.</p>
            <Link href="/dashboard/bnhub/bookings" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: theme.accent }}>
              Manage bookings →
            </Link>
          </PremiumSectionCard>
        </div>

      </div>
    </HubLayout>
  );
}
