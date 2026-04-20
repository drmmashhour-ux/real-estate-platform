import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { HostIcsClient } from "./host-ics-client";

export const dynamic = "force-dynamic";

export default async function HostIcsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/host/channels/ics");

  const [listings, imports, feeds] = await Promise.all([
    prisma.shortTermListing.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.listingIcsImport.findMany({
      where: { listing: { ownerId: userId } },
      select: {
        id: true,
        listingId: true,
        sourceName: true,
        icsUrl: true,
        isEnabled: true,
        lastSyncedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listingIcsFeed.findMany({
      where: { listing: { ownerId: userId } },
      select: {
        listingId: true,
        id: true,
        token: true,
        isEnabled: true,
        updatedAt: true,
      },
    }),
  ]);

  const feedMap: Record<string, { id: string; token: string; isEnabled: boolean; updatedAt: string } | null> = {};
  for (const f of feeds) {
    feedMap[f.listingId] = {
      id: f.id,
      token: f.token,
      isEnabled: f.isEnabled,
      updatedAt: f.updatedAt.toISOString(),
    };
  }

  const siteBase =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string" && process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">ICS calendar sync</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Import and export listing calendars using ICS links. BNHub stays the source of truth — imports only create
          blocking hints in <code className="text-zinc-300">external_calendar_events</code>; they never overwrite BNHub
          bookings.
        </p>
      </div>

      <HostIcsClient
        listings={listings}
        initialImports={imports.map((i) => ({
          ...i,
          lastSyncedAt: i.lastSyncedAt?.toISOString() ?? null,
          createdAt: i.createdAt.toISOString(),
        }))}
        initialFeeds={feedMap}
        siteBase={siteBase}
      />
    </div>
  );
}
