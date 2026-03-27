import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logIntakeEvent } from "@/modules/intake/services/log-intake-event";
import {
  getIntakeTemplateSeeds,
  isValidIntakeTemplateKey,
  type IntakeTemplateKey,
} from "@/modules/intake/services/intake-templates";

function normalizeTitle(t: string): string {
  return t.trim().toLowerCase();
}

/**
 * Creates missing RequiredDocumentItem rows for a template. Skips duplicates by same normalized title + category.
 */
export async function applyIntakeTemplate(params: {
  brokerClientId: string;
  intakeProfileId: string | null;
  templateKey: string;
  actorId: string;
}): Promise<{ created: { id: string; title: string }[]; skipped: number }> {
  if (!isValidIntakeTemplateKey(params.templateKey)) {
    throw new Error("INVALID_TEMPLATE");
  }
  const key = params.templateKey as IntakeTemplateKey;
  const seeds = getIntakeTemplateSeeds(key);

  const existing = await prisma.requiredDocumentItem.findMany({
    where: { brokerClientId: params.brokerClientId, deletedAt: null },
    select: { title: true, category: true },
  });
  const existingKeys = new Set(existing.map((e) => `${normalizeTitle(e.title)}|${e.category}`));

  const created: { id: string; title: string }[] = [];
  let skipped = 0;

  for (const seed of seeds) {
    const dedupeKey = `${normalizeTitle(seed.title)}|${seed.category}`;
    if (existingKeys.has(dedupeKey)) {
      skipped += 1;
      continue;
    }
    existingKeys.add(dedupeKey);

    const dueAt =
      seed.suggestedDueInDays != null
        ? new Date(Date.now() + seed.suggestedDueInDays * 24 * 60 * 60 * 1000)
        : undefined;

    const row = await prisma.requiredDocumentItem.create({
      data: {
        brokerClientId: params.brokerClientId,
        intakeProfileId: params.intakeProfileId ?? undefined,
        title: seed.title,
        description: seed.description ?? undefined,
        category: seed.category,
        isMandatory: seed.isMandatory,
        status: "REQUIRED",
        dueAt,
      },
      select: { id: true, title: true },
    });
    created.push(row);
  }

  for (const row of created) {
    await logIntakeEvent({
      type: "DOCUMENT_REQUESTED",
      brokerClientId: params.brokerClientId,
      intakeProfileId: params.intakeProfileId,
      requiredDocumentItemId: row.id,
      actorId: params.actorId,
      message: `From template ${key}`,
      metadata: { templateKey: key } as Prisma.InputJsonValue,
    });
  }

  return { created, skipped };
}
