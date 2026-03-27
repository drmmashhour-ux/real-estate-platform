import Link from "next/link";
import { prisma } from "@/lib/db";
import { FlaggedIncidentsList, MapOverviewClient } from "./map-overview-client";

export const dynamic = "force-dynamic";

export default async function AdminMapOverviewPage() {
  const [bnhubRows, fsboRows, incidents] = await Promise.all([
    prisma.shortTermListing.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        listingStatus: "PUBLISHED",
      },
      take: 500,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        latitude: true,
        longitude: true,
        nightPriceCents: true,
        photos: true,
      },
    }),
    prisma.fsboListing.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        status: "ACTIVE",
        moderationStatus: "APPROVED",
      },
      take: 500,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        latitude: true,
        longitude: true,
        priceCents: true,
        coverImage: true,
        images: true,
      },
    }),
    prisma.trustSafetyIncident.findMany({
      where: {
        listingId: { not: null },
        status: { notIn: ["RESOLVED", "CLOSED"] },
        OR: [
          { incidentCategory: { contains: "pet", mode: "insensitive" } },
          { incidentCategory: { contains: "noise", mode: "insensitive" } },
          { incidentCategory: { contains: "animal", mode: "insensitive" } },
          { description: { contains: "pet", mode: "insensitive" } },
          { description: { contains: "noise", mode: "insensitive" } },
        ],
      },
      take: 40,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        incidentCategory: true,
        status: true,
        description: true,
        createdAt: true,
        listing: { select: { id: true, title: true, city: true } },
      },
    }),
  ]);

  const bnhubPins = bnhubRows.map((r) => {
    const photos = r.photos;
    const img =
      Array.isArray(photos) && photos.length > 0 && typeof photos[0] === "string" ? photos[0] : null;
    return {
      id: r.id,
      kind: "bnhub" as const,
      title: r.title,
      latitude: r.latitude as number,
      longitude: r.longitude as number,
      price: r.nightPriceCents / 100,
      href: `/bnhub/${r.id}`,
      image: img,
    };
  });

  const fsboPins = fsboRows.map((r) => ({
    id: r.id,
    kind: "fsbo" as const,
    title: r.title,
    latitude: r.latitude as number,
    longitude: r.longitude as number,
    price: r.priceCents / 100,
    href: `/listings/${r.id}`,
    image: r.coverImage ?? (Array.isArray(r.images) && r.images[0] ? r.images[0] : null),
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin/dashboard" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Map overview</h1>
        <p className="mt-1 text-slate-400">
          BNHub stays and FSBO listings with coordinates — for supply and trust operations.
        </p>

        <section className="mt-8">
          <MapOverviewClient bnhubPins={bnhubPins} fsboPins={fsboPins} />
        </section>

        <section className="mt-12 border-t border-slate-800 pt-8">
          <h2 className="text-lg font-semibold text-white">Flagged incidents (noise / pets)</h2>
          <p className="mt-1 text-sm text-slate-500">Open trust &amp; safety rows matching keyword heuristics.</p>
          <div className="mt-4">
            <FlaggedIncidentsList incidents={incidents} />
          </div>
        </section>
      </div>
    </main>
  );
}
