import { BookingStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CITY_ZONE_DATA_SCOPE_NOTE, computeZoneActivityScore } from "@/lib/market/zones";

function buildZoneKey(lat: number, lng: number) {
  return `${lat.toFixed(2)}::${lng.toFixed(2)}`;
}

function bucketCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}

type ZoneAgg = {
  city: string;
  province: string;
  zoneKey: string;
  centerLat: number;
  centerLng: number;
  listingsCount: number;
  soldCount: number;
  reservationsCount: number;
  dealCount: number;
  visitorsCount: number;
};

export async function rebuildCityActivityZones(city: string, province = "QC") {
  const cityFilter: Prisma.StringFilter = { equals: city.trim(), mode: "insensitive" };

  const [fsboListings, strListings, bookings, viewGroups] = await Promise.all([
    prisma.fsboListing.findMany({
      where: {
        city: cityFilter,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        status: true,
      },
    }),
    prisma.shortTermListing.findMany({
      where: {
        city: cityFilter,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        listingStatus: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        listing: { city: cityFilter },
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.AWAITING_HOST_APPROVAL,
            BookingStatus.CONFIRMED,
            BookingStatus.COMPLETED,
          ],
        },
      },
      select: {
        listing: { select: { latitude: true, longitude: true } },
      },
    }),
    prisma.buyerListingView.groupBy({
      by: ["fsboListingId"],
      where: {
        fsboListing: { city: cityFilter },
      },
      _count: { _all: true },
    }),
  ]);

  const listingViews = new Map<string, number>();
  for (const row of viewGroups) {
    listingViews.set(row.fsboListingId, row._count._all);
  }

  const zones = new Map<string, ZoneAgg>();
  const canonicalCity = city.trim();

  function bumpZone(
    lat: number,
    lng: number,
    delta: {
      listingsCount?: number;
      soldCount?: number;
      reservationsCount?: number;
      dealCount?: number;
      visitorsCount?: number;
    },
  ) {
    const latB = bucketCoordinate(lat);
    const lngB = bucketCoordinate(lng);
    const key = buildZoneKey(latB, lngB);
    const existing = zones.get(key);
    if (!existing) {
      zones.set(key, {
        city: canonicalCity,
        province,
        zoneKey: key,
        centerLat: latB,
        centerLng: lngB,
        listingsCount: delta.listingsCount ?? 0,
        soldCount: delta.soldCount ?? 0,
        reservationsCount: delta.reservationsCount ?? 0,
        dealCount: delta.dealCount ?? 0,
        visitorsCount: delta.visitorsCount ?? 0,
      });
      return;
    }
    existing.listingsCount += delta.listingsCount ?? 0;
    existing.soldCount += delta.soldCount ?? 0;
    existing.reservationsCount += delta.reservationsCount ?? 0;
    existing.dealCount += delta.dealCount ?? 0;
    existing.visitorsCount += delta.visitorsCount ?? 0;
  }

  for (const listing of fsboListings) {
    if (listing.latitude == null || listing.longitude == null) continue;
    const sold = listing.status === "SOLD" ? 1 : 0;
    bumpZone(listing.latitude, listing.longitude, {
      listingsCount: 1,
      soldCount: sold,
      visitorsCount: listingViews.get(listing.id) ?? 0,
    });
  }

  for (const listing of strListings) {
    if (listing.latitude == null || listing.longitude == null) continue;
    bumpZone(listing.latitude, listing.longitude, { listingsCount: 1 });
  }

  for (const b of bookings) {
    const lat = b.listing.latitude;
    const lng = b.listing.longitude;
    if (lat == null || lng == null) continue;
    bumpZone(lat, lng, { reservationsCount: 1 });
  }

  for (const zone of zones.values()) {
    const score = computeZoneActivityScore({
      listingsCount: zone.listingsCount,
      soldCount: zone.soldCount,
      reservationsCount: zone.reservationsCount,
      dealCount: zone.dealCount,
      visitorsCount: zone.visitorsCount,
    });

    await prisma.cityActivityZone.upsert({
      where: {
        city_zoneKey: {
          city: zone.city,
          zoneKey: zone.zoneKey,
        },
      },
      create: {
        city: zone.city,
        province: zone.province,
        zoneKey: zone.zoneKey,
        centerLat: zone.centerLat,
        centerLng: zone.centerLng,
        listingsCount: zone.listingsCount,
        soldCount: zone.soldCount,
        reservationsCount: zone.reservationsCount,
        dealCount: zone.dealCount,
        visitorsCount: zone.visitorsCount,
        activityScore: score.activityScore,
        activityLabel: score.activityLabel,
        dataScopeNote: CITY_ZONE_DATA_SCOPE_NOTE,
      },
      update: {
        listingsCount: zone.listingsCount,
        soldCount: zone.soldCount,
        reservationsCount: zone.reservationsCount,
        dealCount: zone.dealCount,
        visitorsCount: zone.visitorsCount,
        activityScore: score.activityScore,
        activityLabel: score.activityLabel,
        dataScopeNote: CITY_ZONE_DATA_SCOPE_NOTE,
        province: zone.province,
        centerLat: zone.centerLat,
        centerLng: zone.centerLng,
      },
    });
  }
}
