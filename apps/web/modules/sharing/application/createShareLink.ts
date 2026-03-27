import { randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";

export type CreateShareLinkInput = {
  resourceType: string;
  resourceKey: string;
  title?: string | null;
  summaryLine?: string | null;
  trustScoreHint?: number | null;
  dealScoreHint?: number | null;
  creatorUserId?: string | null;
};

function newToken(): string {
  return randomBytes(14).toString("base64url");
}

export async function createOrUpdateShareLink(
  db: PrismaClient,
  input: CreateShareLinkInput
): Promise<{ token: string; id: string }> {
  const existing = await db.publicShareLink.findFirst({
    where: { resourceType: input.resourceType, resourceKey: input.resourceKey },
  });
  if (existing) {
    const updated = await db.publicShareLink.update({
      where: { id: existing.id },
      data: {
        title: input.title ?? existing.title,
        summaryLine: input.summaryLine ?? existing.summaryLine,
        trustScoreHint: input.trustScoreHint ?? existing.trustScoreHint,
        dealScoreHint: input.dealScoreHint ?? existing.dealScoreHint,
      },
    });
    return { token: updated.token, id: updated.id };
  }

  const token = newToken();
  const row = await db.publicShareLink.create({
    data: {
      token,
      resourceType: input.resourceType,
      resourceKey: input.resourceKey,
      creatorUserId: input.creatorUserId ?? null,
      title: input.title ?? null,
      summaryLine: input.summaryLine ?? null,
      trustScoreHint: input.trustScoreHint ?? null,
      dealScoreHint: input.dealScoreHint ?? null,
    },
  });
  return { token: row.token, id: row.id };
}
