import { prisma } from "@/lib/db";

export async function geospatialMismatchSummary() {
  const weak = await prisma.trustgraphGeospatialValidation.count({
    where: { precisionScore: { lt: 0.5 } },
  });
  const cityMismatch = await prisma.trustgraphGeospatialValidation.count({
    where: { cityMatch: false },
  });
  return { weakPrecisionCount: weak, cityMismatchCount: cityMismatch };
}
