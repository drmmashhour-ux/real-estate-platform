import type { LecipmLegalDocumentTemplateKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEFAULT_TEMPLATE_BODIES } from "./default-template-bodies";

/**
 * Ensures each template kind exists with at least version 1 (idempotent seed).
 */
export async function ensureDefaultTemplates(): Promise<void> {
  const kinds = Object.keys(DEFAULT_TEMPLATE_BODIES) as LecipmLegalDocumentTemplateKind[];
  for (const kind of kinds) {
    const def = DEFAULT_TEMPLATE_BODIES[kind];
    const template = await prisma.lecipmLegalDocumentTemplate.upsert({
      where: { kind },
      create: {
        kind,
        name: def.name,
        description: "LECIPM default — edit via template version API or DB.",
        isActive: true,
      },
      update: { name: def.name },
    });
    const existingV = await prisma.lecipmLegalDocumentTemplateVersion.findFirst({
      where: { templateId: template.id },
      orderBy: { versionNumber: "desc" },
    });
    if (!existingV) {
      await prisma.lecipmLegalDocumentTemplateVersion.create({
        data: {
          templateId: template.id,
          versionNumber: 1,
          bodyHtml: def.bodyHtml,
          changelog: "initial_seed",
        },
      });
    }
  }
}

export async function getLatestTemplateVersion(kind: LecipmLegalDocumentTemplateKind) {
  const template = await prisma.lecipmLegalDocumentTemplate.findUnique({
    where: { kind },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
  if (!template?.versions[0]) return null;
  return { template, version: template.versions[0] };
}

export async function createTemplateVersion(input: {
  kind: LecipmLegalDocumentTemplateKind;
  bodyHtml: string;
  changelog?: string | null;
  userId: string | null;
}): Promise<{ versionId: string; versionNumber: number }> {
  const template = await prisma.lecipmLegalDocumentTemplate.findUnique({ where: { kind: input.kind } });
  if (!template) throw new Error("Template kind not registered.");
  const last = await prisma.lecipmLegalDocumentTemplateVersion.findFirst({
    where: { templateId: template.id },
    orderBy: { versionNumber: "desc" },
  });
  const next = (last?.versionNumber ?? 0) + 1;
  const v = await prisma.lecipmLegalDocumentTemplateVersion.create({
    data: {
      templateId: template.id,
      versionNumber: next,
      bodyHtml: input.bodyHtml,
      changelog: input.changelog ?? null,
      createdByUserId: input.userId,
    },
  });
  return { versionId: v.id, versionNumber: v.versionNumber };
}

export async function listTemplatesForAdmin(): Promise<
  { kind: LecipmLegalDocumentTemplateKind; name: string; latestVersion: number }[]
> {
  const rows = await prisma.lecipmLegalDocumentTemplate.findMany({
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1, select: { versionNumber: true } },
    },
  });
  return rows.map((r) => ({
    kind: r.kind,
    name: r.name,
    latestVersion: r.versions[0]?.versionNumber ?? 0,
  }));
}
