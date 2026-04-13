import type { ReputationEntityType, ReputationLevel } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ReputationBadge = { id: string; label: string; kind: string };

export async function getReputationBadges(
  entityType: ReputationEntityType,
  entityId: string
): Promise<ReputationBadge[]> {
  const [row, hostBadges, favs] = await Promise.all([
    prisma.reputationScore.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
    }),
    entityType === "host"
      ? prisma.hostBadge.findMany({ where: { hostId: entityId }, select: { badgeType: true } })
      : Promise.resolve([]),
    entityType === "listing"
      ? prisma.bnhubGuestFavorite.count({ where: { listingId: entityId } })
      : Promise.resolve(0),
  ]);

  const out: ReputationBadge[] = [];

  if (row) {
    if (row.level === "excellent") out.push({ id: "exc", label: "Excellent reputation", kind: "excellent_reputation" });
    else if (row.level === "good") out.push({ id: "good", label: "Highly rated", kind: "good_reputation" });
  }

  if (entityType === "host") {
    for (const b of hostBadges) {
      if (b.badgeType === "fast_responder") {
        out.push({ id: "fr", label: "Fast responder", kind: "fast_responder" });
      }
      if (b.badgeType === "reliable_host") {
        out.push({ id: "rh", label: "Reliable host", kind: "reliable_host" });
      }
    }
    if (row && row.reviewScore >= 82) {
      out.push({ id: "trh", label: "Top-rated host", kind: "top_rated_host" });
    }
  }

  if (entityType === "broker" && row && row.responsivenessScore >= 78) {
    out.push({ id: "rb", label: "Reliable broker", kind: "reliable_broker" });
  }

  if (entityType === "seller" && row && row.level === "good") {
    out.push({ id: "ts", label: "Trusted seller", kind: "trusted_seller" });
  }

  if (entityType === "listing" && favs >= 12 && row && row.level !== "poor") {
    out.push({ id: "gf", label: "Guest favorite", kind: "guest_favorite" });
  }

  return dedupe(out);
}

function dedupe(b: ReputationBadge[]): ReputationBadge[] {
  const s = new Set<string>();
  return b.filter((x) => {
    if (s.has(x.kind)) return false;
    s.add(x.kind);
    return true;
  });
}

export function reputationLevelLabel(level: ReputationLevel): string {
  switch (level) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "fair":
      return "Fair";
    default:
      return "Poor";
  }
}
