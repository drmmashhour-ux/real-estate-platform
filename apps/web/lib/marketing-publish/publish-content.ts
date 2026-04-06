import type { MarketingContent, MarketingContentStatus, MarketingPublishChannel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getMarketingPublishProvider } from "./providers";
import { sanitizeMarketingError } from "./sanitize-error";
import type { PublishMarketingContentParams, PublishMarketingContentResult } from "./types";

/**
 * After a successful publish, optionally push a snapshot into marketing_metrics for analytics prep.
 * TODO: wire external platform metrics + A/B variants here.
 */
function _analyticsHookPlaceholder(_contentId: string, _externalPostId: string | null | undefined) {
  void _contentId;
  void _externalPostId;
}

function resolvePublishChannel(
  row: MarketingContent,
  override?: MarketingPublishChannel
): MarketingPublishChannel | null {
  if (override) return override;
  if (row.publishChannel) return row.publishChannel;
  if (row.type === "EMAIL") return "EMAIL";
  const p = (row.platform ?? "").toLowerCase();
  if (p.includes("twitter") || p === "x") return "X";
  if (p.includes("linkedin")) return "LINKEDIN";
  if (p.includes("instagram")) return "INSTAGRAM";
  if (p.includes("tiktok")) return "TIKTOK";
  return null;
}

async function claimContentForPublishing(
  id: string,
  mode: "immediate" | "scheduled_due",
  now: Date
): Promise<{ content: MarketingContent; previousStatus: MarketingContentStatus } | null> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.marketingContent.findUnique({ where: { id } });
    if (!row) return null;

    const previousStatus = row.status;

    const where =
      mode === "scheduled_due"
        ? { id, status: "SCHEDULED" as const, scheduledAt: { lte: now } }
        : { id, status: { in: ["APPROVED" as const, "SCHEDULED" as const] } };

    const updated = await tx.marketingContent.updateMany({
      where,
      data: { status: "PUBLISHING" },
    });
    if (updated.count === 0) return null;

    const content = await tx.marketingContent.findUnique({ where: { id } });
    if (!content) return null;
    return { content, previousStatus };
  });
}

/**
 * Server-only publish pipeline: claim → job row → provider → content + job terminal state.
 */
export async function publishMarketingContent(
  params: PublishMarketingContentParams
): Promise<PublishMarketingContentResult> {
  const now = new Date();

  const peek = await prisma.marketingContent.findUnique({ where: { id: params.contentId } });
  if (!peek) {
    return { ok: false, code: "NOT_FOUND", error: "Content not found" };
  }

  if (params.cronLiveOnly && peek.publishDryRun) {
    return { ok: false, code: "SKIPPED_DRY_RUN", error: "Cron skips dry-run items" };
  }

  const channel = resolvePublishChannel(peek, params.channel);
  if (!channel) {
    return {
      ok: false,
      code: "NEED_CHANNEL",
      error: "Set publish channel on content or pass channel in the request",
    };
  }

  const effectiveDryRun = params.dryRun ?? peek.publishDryRun;
  const allowLive = !effectiveDryRun;

  const claimed = await claimContentForPublishing(params.contentId, params.mode, now);
  if (!claimed) {
    return {
      ok: false,
      code: "NOT_ELIGIBLE",
      error:
        params.mode === "scheduled_due"
          ? "Content must be SCHEDULED with scheduledAt in the past"
          : "Content must be APPROVED or SCHEDULED",
    };
  }

  const { content, previousStatus } = claimed;

  const job = await prisma.marketingPublishJob.create({
    data: {
      contentId: content.id,
      channel,
      status: "RUNNING",
      startedAt: now,
      dryRun: effectiveDryRun,
      scheduledAt: content.scheduledAt,
    },
  });

  const provider = getMarketingPublishProvider(channel);
  const bodyText = content.content;
  const emailBody = content.emailBody ?? (content.type === "EMAIL" ? content.content : null);

  try {
    const result = await provider({
      contentId: content.id,
      bodyText,
      emailSubject: content.emailSubject,
      emailBody,
      emailCta: content.emailCta,
      channel,
      publishTargetId: content.publishTargetId,
      contentType: content.type,
      allowLive,
    });

    const finishedAt = new Date();
    const jobTerminal = !result.ok ? "FAILED" : result.executedDryRun ? "DRY_RUN" : "SUCCESS";

    await prisma.marketingPublishJob.update({
      where: { id: job.id },
      data: {
        status: jobTerminal,
        finishedAt,
        externalPostId: result.externalPostId ?? null,
        responseSummary: result.summary ?? null,
        errorMessage: result.errorMessage ? sanitizeMarketingError(result.errorMessage) : null,
      },
    });

    if (result.ok && result.executedDryRun) {
      if (params.mode === "scheduled_due") {
        await prisma.marketingContent.update({
          where: { id: content.id },
          data: { status: "APPROVED", scheduledAt: null },
        });
      } else {
        await prisma.marketingContent.update({
          where: { id: content.id },
          data: {
            status: previousStatus === "SCHEDULED" ? "SCHEDULED" : "APPROVED",
          },
        });
      }
    } else if (result.ok) {
      await prisma.marketingContent.update({
        where: { id: content.id },
        data: { status: "PUBLISHED" },
      });
      _analyticsHookPlaceholder(content.id, result.externalPostId);
    } else {
      await prisma.marketingContent.update({
        where: { id: content.id },
        data: { status: "FAILED" },
      });
    }

    const finalRow = await prisma.marketingContent.findUnique({
      where: { id: content.id },
      select: { status: true },
    });

    return {
      ok: result.ok,
      code: result.ok ? undefined : "PROVIDER_FAILED",
      error: result.ok ? undefined : result.errorMessage ?? "Provider failed",
      jobId: job.id,
      contentStatus: finalRow?.status,
      executedDryRun: result.executedDryRun,
      summary: result.summary ?? null,
      externalPostId: result.externalPostId ?? null,
    };
  } catch (e) {
    const msg = sanitizeMarketingError(e);
    const finishedAt = new Date();
    await prisma.marketingPublishJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt,
        errorMessage: msg,
        responseSummary: "Unhandled exception during publish",
      },
    });
    await prisma.marketingContent.update({
      where: { id: content.id },
      data: { status: "FAILED" },
    });
    return {
      ok: false,
      code: "INTERNAL",
      error: "Publish failed",
      jobId: job.id,
      contentStatus: "FAILED",
    };
  }
}
