import { prisma } from "@/lib/db";
import { DEFAULT_MESSAGE_TEMPLATES } from "./defaultTemplates";

export type SeedMessagingResult = { created: number; updated: number };

/**
 * First run: bulk insert. Later runs: upsert each default row (new types + refreshed copy).
 */
export async function seedMessagingTemplatesIfEmpty(): Promise<SeedMessagingResult> {
  const n = await prisma.messageTemplate.count();
  if (n === 0) {
    await prisma.messageTemplate.createMany({
      data: DEFAULT_MESSAGE_TEMPLATES.map((t) => ({
        segment: t.segment,
        type: t.type,
        subject: t.subject,
        content: t.content,
      })),
    });
    return { created: DEFAULT_MESSAGE_TEMPLATES.length, updated: 0 };
  }

  let created = 0;
  let updated = 0;
  for (const t of DEFAULT_MESSAGE_TEMPLATES) {
    const ex = await prisma.messageTemplate.findFirst({
      where: { segment: t.segment, type: t.type },
    });
    if (!ex) {
      await prisma.messageTemplate.create({
        data: {
          segment: t.segment,
          type: t.type,
          subject: t.subject,
          content: t.content,
        },
      });
      created++;
    } else {
      await prisma.messageTemplate.update({
        where: { id: ex.id },
        data: { subject: t.subject, content: t.content },
      });
      updated++;
    }
  }
  return { created, updated };
}
