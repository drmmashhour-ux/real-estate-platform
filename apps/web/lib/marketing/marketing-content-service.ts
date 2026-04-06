import type {
  MarketingContentStatus,
  MarketingContentType,
  MarketingPublishChannel,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export type MarketingTypeApi = "social_post" | "caption" | "email" | "growth_idea";

export function toPrismaContentType(t: MarketingTypeApi): MarketingContentType {
  switch (t) {
    case "social_post":
      return "SOCIAL_POST";
    case "caption":
      return "CAPTION";
    case "email":
      return "EMAIL";
    case "growth_idea":
      return "GROWTH_IDEA";
    default:
      return "SOCIAL_POST";
  }
}

export function fromPrismaContentType(t: MarketingContentType): MarketingTypeApi {
  switch (t) {
    case "SOCIAL_POST":
      return "social_post";
    case "CAPTION":
      return "caption";
    case "EMAIL":
      return "email";
    case "GROWTH_IDEA":
      return "growth_idea";
    default:
      return "social_post";
  }
}

export async function createDraft(params: {
  userId: string | null;
  type: MarketingTypeApi;
  content: string;
  contentJson?: Prisma.InputJsonValue;
  platform?: string | null;
  topic?: string | null;
  tone?: string | null;
  audience?: string | null;
  theme?: string | null;
  aiSource?: string | null;
  email?: { subject: string; body: string; cta: string; isEmailCampaign?: boolean };
  /** When set without `email`, applies to campaign flag (variant groups). */
  isEmailCampaign?: boolean;
  status?: MarketingContentStatus;
  parentContentId?: string | null;
  variantLabel?: string | null;
  isVariant?: boolean;
  isWinnerVariant?: boolean;
}) {
  const row = await prisma.marketingContent.create({
    data: {
      type: toPrismaContentType(params.type),
      content: params.content,
      contentJson: params.contentJson ?? undefined,
      platform: params.platform ?? undefined,
      topic: params.topic ?? undefined,
      tone: params.tone ?? undefined,
      audience: params.audience ?? undefined,
      theme: params.theme ?? undefined,
      aiSource: params.aiSource ?? undefined,
      status: params.status ?? "DRAFT",
      createdByUserId: params.userId ?? undefined,
      emailSubject: params.email?.subject,
      emailBody: params.email?.body,
      emailCta: params.email?.cta,
      isEmailCampaign: params.isEmailCampaign ?? params.email?.isEmailCampaign ?? false,
      ...(params.parentContentId !== undefined && params.parentContentId !== null
        ? { parentContentId: params.parentContentId }
        : {}),
      variantLabel: params.variantLabel ?? undefined,
      isVariant: params.isVariant ?? false,
      isWinnerVariant: params.isWinnerVariant ?? false,
    },
    select: { id: true },
  });
  return row.id;
}

export async function createVariantDraftGroup(params: {
  userId: string | null;
  type: MarketingTypeApi;
  shared: {
    platform?: string | null;
    topic?: string | null;
    tone?: string | null;
    audience?: string | null;
    theme?: string | null;
    contentJson?: Prisma.InputJsonValue;
    isEmailCampaign?: boolean;
  };
  items: Array<{
    label: string;
    content: string;
    aiSource: string;
    contentJson?: Prisma.InputJsonValue;
    email?: { subject: string; body: string; cta: string; isEmailCampaign?: boolean };
  }>;
}): Promise<{ parentId: string; allIds: string[] }> {
  const [first, ...rest] = params.items;
  if (!first) {
    throw new Error("createVariantDraftGroup: at least one variant required");
  }

  const parentId = await createDraft({
    userId: params.userId,
    type: params.type,
    content: first.content,
    contentJson: first.contentJson ?? params.shared.contentJson,
    platform: params.shared.platform,
    topic: params.shared.topic,
    tone: params.shared.tone,
    audience: params.shared.audience,
    theme: params.shared.theme,
    aiSource: first.aiSource,
    email: first.email,
    isEmailCampaign: first.email?.isEmailCampaign ?? params.shared.isEmailCampaign ?? false,
    variantLabel: first.label,
    isVariant: false,
  });

  const allIds = [parentId];
  for (const item of rest) {
    const id = await createDraft({
      userId: params.userId,
      type: params.type,
      content: item.content,
      contentJson: item.contentJson ?? params.shared.contentJson,
      platform: params.shared.platform,
      topic: params.shared.topic,
      tone: params.shared.tone,
      audience: params.shared.audience,
      theme: params.shared.theme,
      aiSource: item.aiSource,
      email: item.email,
      isEmailCampaign: item.email?.isEmailCampaign ?? params.shared.isEmailCampaign ?? false,
      parentContentId: parentId,
      variantLabel: item.label,
      isVariant: true,
    });
    allIds.push(id);
  }

  return { parentId, allIds };
}

export async function markVariantWinner(parentContentId: string, winningContentId: string): Promise<void> {
  const parent = await prisma.marketingContent.findUnique({ where: { id: parentContentId } });
  if (!parent || parent.parentContentId != null) {
    throw new Error("Invalid parent content");
  }
  const winner = await prisma.marketingContent.findUnique({ where: { id: winningContentId } });
  if (!winner || (winner.id !== parentContentId && winner.parentContentId !== parentContentId)) {
    throw new Error("Winner must be the parent row or a child variant");
  }

  await prisma.$transaction([
    prisma.marketingContent.updateMany({
      where: { OR: [{ id: parentContentId }, { parentContentId: parentContentId }] },
      data: { isWinnerVariant: false },
    }),
    prisma.marketingContent.update({
      where: { id: winningContentId },
      data: { isWinnerVariant: true },
    }),
  ]);
}

export async function listContent(params: {
  type?: MarketingContentType;
  status?: MarketingContentStatus;
  take?: number;
  /** When false, include A/B child rows in the list (default: hide variants). */
  hideVariants?: boolean;
}) {
  const take = Math.min(params.take ?? 80, 200);
  const hideVariants = params.hideVariants !== false;
  return prisma.marketingContent.findMany({
    where: {
      ...(params.type ? { type: params.type } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(hideVariants ? { isVariant: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      content: true,
      platform: true,
      topic: true,
      tone: true,
      audience: true,
      theme: true,
      status: true,
      scheduledAt: true,
      createdAt: true,
      aiSource: true,
      emailSubject: true,
      emailBody: true,
      emailCta: true,
      isEmailCampaign: true,
      publishChannel: true,
      publishTargetId: true,
      publishDryRun: true,
      parentContentId: true,
      isVariant: true,
      variantLabel: true,
      isWinnerVariant: true,
    },
  });
}

export async function getContent(id: string) {
  return prisma.marketingContent.findUnique({
    where: { id },
    include: {
      metrics: { orderBy: { createdAt: "desc" }, take: 50 },
      publishJobs: { orderBy: { createdAt: "desc" }, take: 40 },
      childVariants: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          variantLabel: true,
          isVariant: true,
          isWinnerVariant: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function updateContent(
  id: string,
  data: {
    status?: MarketingContentStatus;
    scheduledAt?: Date | null;
    isEmailCampaign?: boolean;
    content?: string;
    topic?: string | null;
    tone?: string | null;
    audience?: string | null;
    platform?: string | null;
    theme?: string | null;
    emailSubject?: string | null;
    emailBody?: string | null;
    emailCta?: string | null;
    publishChannel?: MarketingPublishChannel | null;
    publishTargetId?: string | null;
    publishDryRun?: boolean;
  }
) {
  const patch: Prisma.MarketingContentUpdateInput = {};
  if (data.status !== undefined) patch.status = data.status;
  if (data.scheduledAt !== undefined) patch.scheduledAt = data.scheduledAt;
  if (data.isEmailCampaign !== undefined) patch.isEmailCampaign = data.isEmailCampaign;
  if (data.content !== undefined) patch.content = data.content;
  if (data.topic !== undefined) patch.topic = data.topic;
  if (data.tone !== undefined) patch.tone = data.tone;
  if (data.audience !== undefined) patch.audience = data.audience;
  if (data.platform !== undefined) patch.platform = data.platform;
  if (data.theme !== undefined) patch.theme = data.theme;
  if (data.emailSubject !== undefined) patch.emailSubject = data.emailSubject;
  if (data.emailBody !== undefined) patch.emailBody = data.emailBody;
  if (data.emailCta !== undefined) patch.emailCta = data.emailCta;
  if (data.publishChannel !== undefined) patch.publishChannel = data.publishChannel;
  if (data.publishTargetId !== undefined) patch.publishTargetId = data.publishTargetId;
  if (data.publishDryRun !== undefined) patch.publishDryRun = data.publishDryRun;

  return prisma.marketingContent.update({
    where: { id },
    data: patch,
    select: { id: true, status: true, scheduledAt: true },
  });
}

export async function scheduleContent(contentId: string, scheduledAt: Date) {
  return updateContent(contentId, {
    status: "SCHEDULED",
    scheduledAt,
  });
}

export async function trackMetrics(params: {
  contentId: string;
  views?: number | null;
  clicks?: number | null;
  conversions?: number | null;
  opens?: number | null;
  notes?: string | null;
}) {
  return prisma.marketingMetric.create({
    data: {
      contentId: params.contentId,
      views: params.views ?? undefined,
      clicks: params.clicks ?? undefined,
      conversions: params.conversions ?? undefined,
      opens: params.opens ?? undefined,
      notes: params.notes?.trim() || undefined,
    },
    select: { id: true, createdAt: true },
  });
}

/** Backward-compatible aliases (prefer createDraft, listContent, …). */
export const createMarketingDraft = createDraft;
export const listMarketingContent = listContent;
export const getMarketingContent = getContent;
export const updateMarketingContent = updateContent;
export const scheduleMarketingContent = scheduleContent;
export const appendMarketingMetric = trackMetrics;
