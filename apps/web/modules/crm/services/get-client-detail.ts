import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getBrokerCrmRelatedRecords } from "@/modules/crm/services/aggregates";
import { canViewBrokerClient } from "@/modules/crm/services/broker-crm-permissions";
import { resolveListingTitles } from "@/modules/crm/services/resolve-listings";

export async function getBrokerClientDetailForPage(
  id: string,
  viewer: { id: string; role: PlatformRole }
) {
  const row = await prisma.brokerClient.findUnique({
    where: { id },
    include: {
      interactions: { orderBy: { createdAt: "desc" }, take: 80 },
      listingLinks: { orderBy: { createdAt: "desc" } },
      linkedUser: { select: { id: true, name: true, email: true } },
    },
  });
  if (!row) return { ok: false as const, reason: "not_found" as const };
  if (!canViewBrokerClient(viewer, row)) return { ok: false as const, reason: "forbidden" as const };

  const { listingLinks: rawListingLinks, ...clientRest } = row;
  const listingIds = rawListingLinks.map((l) => l.listingId);
  const titles = await resolveListingTitles(listingIds);
  const listingLinks = rawListingLinks.map((l) => ({
    ...l,
    listingTitle: titles.get(l.listingId)?.title ?? null,
    listingPrice: titles.get(l.listingId)?.price ?? null,
  }));

  const related = await getBrokerCrmRelatedRecords(row);

  return {
    ok: true as const,
    client: { ...clientRest, listingLinks },
    related,
  };
}
