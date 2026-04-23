import { prisma } from "@/lib/db";

export async function rebuildInvestmentZoneSnapshots(city: string, province = "QC") {
  const profiles = await prisma.neighborhoodProfile.findMany({
    where: { city: { equals: city.trim(), mode: "insensitive" }, province },
  });

  if (profiles.length === 0) {
    await prisma.investmentZoneSnapshot.deleteMany({
      where: { province, city: { equals: city.trim(), mode: "insensitive" } },
    });
    return;
  }

  const cities = [...new Set(profiles.map((p) => p.city))];
  for (const c of cities) {
    await prisma.investmentZoneSnapshot.deleteMany({
      where: { city: c, province },
    });
  }

  for (const p of profiles) {
    await prisma.investmentZoneSnapshot.create({
      data: {
        city: p.city,
        province: p.province,
        zoneType: p.investmentZone ?? "neutral",
        neighborhoodKey: p.neighborhoodKey,
        neighborhoodName: p.neighborhoodName,
        scoreOverall: p.scoreOverall ?? null,
        scoreYield: p.scoreYield ?? null,
        scoreRisk: p.scoreRisk ?? null,
      },
    });
  }
}
