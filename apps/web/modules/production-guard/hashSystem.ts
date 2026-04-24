import { createHash } from "crypto";

export function generateDraftHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function storeDraftHash(draftId: string, hash: string, prisma: any) {
  return await prisma.turboDraft.update({
    where: { id: draftId },
    data: {
      integrityHash: hash,
      finalizedAt: new Date()
    }
  });
}

export function verifyDraftHash(content: string, storedHash: string): boolean {
  return generateDraftHash(content) === storedHash;
}
