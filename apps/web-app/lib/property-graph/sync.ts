/**
 * Graph update pipeline: ensure Market and semantic edges stay in sync with transactional data.
 * Call from event handlers or scheduled jobs.
 */

import { prisma } from "@/lib/db";
import { getOrCreateMarket, addGraphEdge } from "./graph-service";

/** Ensure a market exists for the given property identity and link property to market (IN_MARKET edge). */
export async function syncMarketForProperty(propertyIdentityId: string): Promise<void> {
  const prop = await prisma.propertyIdentity.findUnique({
    where: { id: propertyIdentityId },
    select: { municipality: true, province: true, country: true },
  });
  if (!prop) return;
  const market = await getOrCreateMarket({
    municipality: prop.municipality ?? undefined,
    province: prop.province ?? "US",
    country: prop.country ?? "US",
  });
  const existing = await prisma.propertyGraphEdge.findFirst({
    where: {
      fromEntityType: "PROPERTY",
      fromEntityId: propertyIdentityId,
      toEntityType: "MARKET",
      toEntityId: market.id,
      edgeType: "IN_MARKET",
    },
  });
  if (existing) return;
  await addGraphEdge({
    fromEntityType: "PROPERTY",
    fromEntityId: propertyIdentityId,
    toEntityType: "MARKET",
    toEntityId: market.id,
    edgeType: "IN_MARKET",
  });
}

/** Add SIMILAR_TO edge between two properties (e.g. from valuation comparables). */
export async function linkSimilarProperties(
  propertyIdentityIdA: string,
  propertyIdentityIdB: string,
  metadata?: { score?: number; source?: string }
): Promise<void> {
  const [a, b] = [propertyIdentityIdA, propertyIdentityIdB].sort();
  const existing = await prisma.propertyGraphEdge.findFirst({
    where: {
      fromEntityType: "PROPERTY",
      fromEntityId: a,
      toEntityType: "PROPERTY",
      toEntityId: b,
      edgeType: "SIMILAR_TO",
    },
  });
  if (existing) return;
  await addGraphEdge({
    fromEntityType: "PROPERTY",
    fromEntityId: a,
    toEntityType: "PROPERTY",
    toEntityId: b,
    edgeType: "SIMILAR_TO",
    metadata,
  });
}
