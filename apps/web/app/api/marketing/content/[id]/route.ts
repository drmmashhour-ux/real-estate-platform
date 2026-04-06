import { NextRequest } from "next/server";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { marketingContentPatchSchema } from "@/lib/ai-marketing/schemas";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";
import {
  fromPrismaContentType,
  getContent,
  updateContent,
} from "@/lib/marketing/marketing-content-service";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: RouteCtx) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const row = await getContent(id);
    if (!row) {
      return marketingJsonError(404, "Not found", "NOT_FOUND");
    }

    return marketingJsonOk({
      item: {
        id: row.id,
        type: fromPrismaContentType(row.type),
        content: row.content,
        contentJson: row.contentJson,
        platform: row.platform,
        topic: row.topic,
        tone: row.tone,
        audience: row.audience,
        theme: row.theme,
        status: row.status,
        scheduledAt: row.scheduledAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        aiSource: row.aiSource,
        emailSubject: row.emailSubject,
        emailBody: row.emailBody,
        emailCta: row.emailCta,
        isEmailCampaign: row.isEmailCampaign,
        parentContentId: row.parentContentId,
        isVariant: row.isVariant,
        variantLabel: row.variantLabel,
        isWinnerVariant: row.isWinnerVariant,
        childVariants: row.childVariants.map((v) => ({
          id: v.id,
          variantLabel: v.variantLabel,
          isWinnerVariant: v.isWinnerVariant,
          status: v.status,
          preview: v.content.slice(0, 200),
          createdAt: v.createdAt.toISOString(),
        })),
        metrics: row.metrics.map((m) => ({
          id: m.id,
          views: m.views,
          clicks: m.clicks,
          conversions: m.conversions,
          opens: m.opens,
          notes: m.notes,
          createdAt: m.createdAt.toISOString(),
        })),
        publishChannel: row.publishChannel,
        publishTargetId: row.publishTargetId,
        publishDryRun: row.publishDryRun,
        publishJobs: row.publishJobs.map((j) => ({
          id: j.id,
          channel: j.channel,
          status: j.status,
          scheduledAt: j.scheduledAt?.toISOString() ?? null,
          startedAt: j.startedAt?.toISOString() ?? null,
          finishedAt: j.finishedAt?.toISOString() ?? null,
          externalPostId: j.externalPostId,
          errorMessage: j.errorMessage,
          responseSummary: j.responseSummary,
          dryRun: j.dryRun,
          createdAt: j.createdAt.toISOString(),
        })),
      },
    });
  } catch (e) {
    console.error("[api/marketing/content/[id] GET]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return marketingJsonError(400, "Invalid JSON", "INVALID_JSON");
  }

  const parsed = marketingContentPatchSchema.safeParse(json ?? {});
  if (!parsed.success) {
    return marketingJsonError(400, "Invalid input", "VALIDATION_ERROR");
  }

  try {
    const existing = await getContent(id);
    if (!existing) {
      return marketingJsonError(404, "Not found", "NOT_FOUND");
    }

    const d = parsed.data;

    const row = await updateContent(id, {
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.clearScheduledAt === true ? { scheduledAt: null } : {}),
      ...(d.isEmailCampaign !== undefined ? { isEmailCampaign: d.isEmailCampaign } : {}),
      ...(d.content !== undefined ? { content: d.content } : {}),
      ...(d.topic !== undefined ? { topic: d.topic } : {}),
      ...(d.tone !== undefined ? { tone: d.tone } : {}),
      ...(d.audience !== undefined ? { audience: d.audience } : {}),
      ...(d.platform !== undefined ? { platform: d.platform } : {}),
      ...(d.theme !== undefined ? { theme: d.theme } : {}),
      ...(d.emailSubject !== undefined ? { emailSubject: d.emailSubject } : {}),
      ...(d.emailBody !== undefined ? { emailBody: d.emailBody } : {}),
      ...(d.emailCta !== undefined ? { emailCta: d.emailCta } : {}),
      ...(d.publishChannel !== undefined ? { publishChannel: d.publishChannel } : {}),
      ...(d.publishTargetId !== undefined ? { publishTargetId: d.publishTargetId } : {}),
      ...(d.publishDryRun !== undefined ? { publishDryRun: d.publishDryRun } : {}),
    });

    return marketingJsonOk({
      id: row.id,
      status: row.status,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error("[api/marketing/content/[id] PATCH]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
