"use server";

import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { transitionContentStatus } from "@/lib/content/review";
import { publishApprovedContent, rollbackLastPublish } from "@/lib/content/publish";
import { createGeneratedContentDraft } from "@/lib/content/dao";
import { buildListingSeoDraft } from "@/lib/content/generators/listing-seo";
import { toMarketContentConstraints } from "@/lib/content/market-context";
import { getResolvedMarket } from "@/lib/markets";
import { resolveLaunchFlags } from "@/lib/launch/resolve-launch-flags";
import type { PlatformRole } from "@prisma/client";

const ADMIN_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

async function requireAdminActor(): Promise<string> {
  const userId = await getGuestId();
  if (!userId) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, accountStatus: true },
  });
  if (!user || user.accountStatus !== "ACTIVE" || !ADMIN_ROLES.has(user.role)) {
    throw new Error("Forbidden");
  }
  return userId;
}

export async function approveGeneratedContent(contentId: string): Promise<{ ok: boolean; error?: string }> {
  const actorUserId = await requireAdminActor();
  const out = await transitionContentStatus({
    contentId,
    next: "approved",
    actorUserId,
  });
  return out.ok ? { ok: true } : { ok: false, error: out.error };
}

export async function rejectGeneratedContent(contentId: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  const actorUserId = await requireAdminActor();
  const out = await transitionContentStatus({
    contentId,
    next: "rejected",
    actorUserId,
    reviewNote: note ?? null,
  });
  return out.ok ? { ok: true } : { ok: false, error: out.error };
}

export async function submitGeneratedContentForReview(contentId: string): Promise<{ ok: boolean; error?: string }> {
  const actorUserId = await requireAdminActor();
  const out = await transitionContentStatus({
    contentId,
    next: "pending_review",
    actorUserId,
  });
  return out.ok ? { ok: true } : { ok: false, error: out.error };
}

export async function publishGeneratedContent(contentId: string): Promise<{ ok: boolean; error?: string }> {
  const actorUserId = await requireAdminActor();
  const out = await publishApprovedContent({ contentId, actorUserId });
  return out.ok ? { ok: true } : { ok: false, error: out.error };
}

export async function rollbackGeneratedContent(contentId: string): Promise<{ ok: boolean; error?: string }> {
  const actorUserId = await requireAdminActor();
  const out = await rollbackLastPublish({ contentId, actorUserId });
  return out.ok ? { ok: true } : { ok: false, error: out.error };
}

/** Template-only demo row for QA (audit trail; does not touch listings). */
export async function seedTemplateListingSeoDemo(): Promise<{ id: string } | { error: string }> {
  try {
    const flags = await resolveLaunchFlags();
    if (!flags.enableAiContentEngine) {
      return { error: "AI content engine disabled (set ENABLE_AI_CONTENT_ENGINE or launch:enableAiContentEngine)" };
    }
    const actorUserId = await requireAdminActor();
    const market = await getResolvedMarket();
    const constraints = toMarketContentConstraints(market);
    const draft = buildListingSeoDraft(
      {
        locale: "en",
        marketCode: constraints.marketCode,
        surface: "listing_seo_meta",
        tone: "conversion",
        entity: { city: "Demo City", propertyType: "apartment" },
      },
      constraints,
    );
    const row = await createGeneratedContentDraft({
      ...draft,
      createdByUserId: actorUserId,
      createdBySystem: false,
    });
    return { id: row.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "failed" };
  }
}
