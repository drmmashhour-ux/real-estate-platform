import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { defaultInitialStatus } from "./policies";
import { getPromptVersion } from "./templates";
import { mapRowToGeneratedContentRecord } from "./db-map";
import type {
  ContentCreationMode,
  ContentEntityType,
  ContentLocale,
  ContentSurface,
  GenerationSource,
  HostContentOverwritePreference,
} from "./types";
import { logGeneratedContentAudit } from "./audit-log";

export type CreateGeneratedContentDraftInput = {
  surface: ContentSurface;
  locale: ContentLocale;
  marketCode: string;
  entityType: ContentEntityType;
  entityId?: string | null;
  title?: string | null;
  body: string;
  summary?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  generationSource: GenerationSource;
  createdByUserId?: string | null;
  createdBySystem?: boolean;
  creationMode?: ContentCreationMode | null;
  sourceContentId?: string | null;
  hostOverwritePolicy?: HostContentOverwritePreference | null;
  metadata?: Record<string, unknown>;
  /** Override default status (e.g. force draft for AI) */
  statusOverride?: "draft" | "pending_review";
};

export async function createGeneratedContentDraft(
  input: CreateGeneratedContentDraftInput,
): Promise<ReturnType<typeof mapRowToGeneratedContentRecord>> {
  const status = input.statusOverride ?? defaultInitialStatus(input.surface);

  const data: Prisma.LecipmGeneratedContentCreateInput = {
    surface: input.surface,
    locale: input.locale,
    marketCode: input.marketCode,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    title: input.title ?? null,
    body: input.body,
    summary: input.summary ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    status,
    createdByUserId: input.createdByUserId ?? null,
    createdBySystem: input.createdBySystem ?? false,
    generationSource: input.generationSource,
    promptVersion: getPromptVersion(),
    creationMode: input.creationMode ?? null,
    sourceContentId: input.sourceContentId ?? null,
    hostOverwritePolicy: input.hostOverwritePolicy ?? null,
    metadata: input.metadata as Prisma.InputJsonValue | undefined,
  };

  const row = await prisma.lecipmGeneratedContent.create({ data });

  await logGeneratedContentAudit({
    contentId: row.id,
    action: "created",
    fromStatus: null,
    toStatus: status,
    actorUserId: input.createdByUserId ?? null,
    actorSystem: input.createdBySystem ?? false,
    snapshot: { title: row.title, body: row.body, seoTitle: row.seoTitle, seoDescription: row.seoDescription },
  });

  return mapRowToGeneratedContentRecord(row);
}

export async function listGeneratedContent(input: {
  take?: number;
  locale?: string;
  marketCode?: string;
  surface?: string;
  status?: string;
  entityType?: string;
}): Promise<ReturnType<typeof mapRowToGeneratedContentRecord>[]> {
  const take = Math.min(input.take ?? 50, 200);
  const rows = await prisma.lecipmGeneratedContent.findMany({
    where: {
      ...(input.locale ? { locale: input.locale } : {}),
      ...(input.marketCode ? { marketCode: input.marketCode } : {}),
      ...(input.surface ? { surface: input.surface } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.entityType ? { entityType: input.entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(mapRowToGeneratedContentRecord);
}
