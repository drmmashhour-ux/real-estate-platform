import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { getFsboListingTrustSummary } from "@/lib/fsbo/listing-trust-summary";
import type { BrokerAttentionItemDto, CopilotBlock } from "@/modules/copilot/domain/copilotTypes";

const LOW_TRUST_MAX = 55;
const TAKE = 25;

/** Drop “nice to have” photo nudges when listing is already active, approved, and moderately trusted. */
function isCosmeticOnlyBrokerNudge(
  row: { trustScore: number | null; moderationStatus: string; status: string },
  issues: string[]
): boolean {
  if (row.moderationStatus !== "APPROVED" || row.status !== "ACTIVE") return false;
  if ((row.trustScore ?? 0) < 62) return false;
  if (issues.length === 0) return false;
  return issues.every((line) => /photo|image|cover|more pictures/i.test(line));
}

export async function runBrokerListingsFix(): Promise<{
  ok: true;
  block: CopilotBlock;
  summaryLine: string;
  usedTrustGraph: boolean;
}> {
  const where: Prisma.FsboListingWhereInput = {
    OR: [
      { trustScore: { lte: LOW_TRUST_MAX } },
      { moderationStatus: { not: "APPROVED" } },
      { status: { in: ["PENDING_VERIFICATION", "DRAFT"] } },
    ],
    NOT: { status: "SOLD" },
  };

  const rows = await prisma.fsboListing.findMany({
    where,
    orderBy: [{ trustScore: "asc" }, { updatedAt: "desc" }],
    take: TAKE,
    select: {
      id: true,
      title: true,
      city: true,
      trustScore: true,
      moderationStatus: true,
      status: true,
      images: true,
      coverImage: true,
    },
  });

  const items: BrokerAttentionItemDto[] = [];

  for (const row of rows) {
    const issues: string[] = [];
    if (row.trustScore != null && row.trustScore <= LOW_TRUST_MAX) {
      issues.push(`Trust score is low (${row.trustScore}) — complete verification and documents.`);
    }
    if (row.moderationStatus !== "APPROVED") {
      issues.push(`Moderation: ${row.moderationStatus.replace(/_/g, " ")}.`);
    }
    if (row.status === "DRAFT" || row.status === "PENDING_VERIFICATION") {
      issues.push(`Listing status: ${row.status.replace(/_/g, " ")}.`);
    }
    const imgs = Array.isArray(row.images) ? row.images.length : 0;
    if (imgs < 3 && !row.coverImage) {
      issues.push("Add a cover image and at least a few photos.");
    } else if (imgs < 3) {
      issues.push("Consider adding more photos for buyer confidence.");
    }

    if (isTrustGraphEnabled()) {
      const tg = await getFsboListingTrustSummary(row.id);
      const miss = tg?.missingItems?.slice(0, 4) ?? [];
      for (const m of miss) {
        issues.push(m.message);
      }
    }

    const issueSlice = issues.slice(0, 8);
    if (isCosmeticOnlyBrokerNudge(row, issueSlice)) {
      continue;
    }

    items.push({
      listingId: row.id,
      title: row.title,
      city: row.city,
      trustScore: row.trustScore,
      moderationStatus: row.moderationStatus,
      status: row.status,
      issues: issueSlice,
    });
  }

  const summaryLine = `Surfaced ${items.length} listings with trust, moderation, media, or TrustGraph gaps (rules-based).`;

  return {
    ok: true,
    block: {
      type: "broker_attention",
      items,
      queryNote: "Prioritized by lowest trust and non-approved moderation — not a compliance verdict.",
    },
    summaryLine,
    usedTrustGraph: isTrustGraphEnabled(),
  };
}
