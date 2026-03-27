import { prisma } from "@/lib/db";
import { assertDocumentAccess } from "@/src/modules/ai-legal-assistant/tools/_access";

export async function getVersionComparison(documentId: string, userId: string, versionA: number, versionB: number) {
  if (!(await assertDocumentAccess(documentId, userId))) throw new Error("forbidden");
  const [a, b] = await Promise.all([
    prisma.documentVersion.findFirst({ where: { documentId, versionNumber: versionA } }),
    prisma.documentVersion.findFirst({ where: { documentId, versionNumber: versionB } }),
  ]);
  const pa = (a?.payload ?? {}) as Record<string, unknown>;
  const pb = (b?.payload ?? {}) as Record<string, unknown>;
  const changedKeys = Array.from(new Set([...Object.keys(pa), ...Object.keys(pb)])).filter((k) => JSON.stringify(pa[k]) !== JSON.stringify(pb[k]));
  return { versionA, versionB, changedKeys };
}
