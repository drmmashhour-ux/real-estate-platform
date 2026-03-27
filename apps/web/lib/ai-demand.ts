/**
 * Demand Forecasting – predict booking demand by city/type, seasonal trends, supply gaps.
 * Outputs for analytics, AI Control Center, host dashboards.
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const FORECAST_MODEL_VERSION = "demand_v1";

export type DemandForecastOutput = {
  region: string;
  forecastDate: Date;
  demandLevel: number;
  bookingsPredicted?: number;
  supplyGap?: number;
  propertyType?: string;
  modelVersion: string;
};

/**
 * Compute demand forecast for a region (and optional property type) for a date.
 * Uses recent booking counts and listing supply as proxy for demand.
 */
export async function computeDemandForecast(params: {
  region: string;
  forecastDate: Date;
  propertyType?: string;
  store?: boolean;
}): Promise<DemandForecastOutput> {
  const start = new Date(params.forecastDate);
  start.setDate(start.getDate() - 30);
  const end = new Date(params.forecastDate);
  end.setDate(end.getDate() + 30);

  const [bookingsCount, listingsCount] = await Promise.all([
    prisma.booking.count({
      where: {
        createdAt: { gte: start, lte: end },
        listing: { city: { contains: params.region, mode: "insensitive" } },
      },
    }),
    prisma.shortTermListing.count({
      where: { city: { contains: params.region, mode: "insensitive" } },
    }),
  ]);

  const occupancyProxy = listingsCount > 0 ? bookingsCount / (listingsCount * 30) : 0;
  const demandLevel = Math.min(1, Math.max(0, occupancyProxy * 3));
  const bookingsPredicted = Math.round(bookingsCount * 1.02);
  const supplyGap = demandLevel > 0.7 && listingsCount < 50 ? 50 - listingsCount : undefined;

  if (params.store) {
    await prisma.demandForecast.create({
      data: {
        region: params.region,
        propertyType: params.propertyType,
        forecastDate: params.forecastDate,
        demandLevel,
        bookingsPredicted,
        supplyGap: supplyGap ?? undefined,
        modelVersion: FORECAST_MODEL_VERSION,
      },
    }).catch(() => {});
  }

  return {
    region: params.region,
    forecastDate: params.forecastDate,
    demandLevel,
    bookingsPredicted,
    supplyGap,
    propertyType: params.propertyType,
    modelVersion: FORECAST_MODEL_VERSION,
  };
}

/** Get stored demand forecasts. */
export async function getDemandForecasts(params: {
  region?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const where: Prisma.DemandForecastWhereInput = {};
  if (params.region) where.region = params.region;
  if (params.from || params.to) {
    where.forecastDate = {};
    if (params.from) where.forecastDate.gte = params.from;
    if (params.to) where.forecastDate.lte = params.to;
  }
  return prisma.demandForecast.findMany({
    where,
    orderBy: { forecastDate: "desc" },
    take: params.limit ?? 90,
  });
}
