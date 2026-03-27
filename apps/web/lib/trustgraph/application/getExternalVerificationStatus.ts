import { prisma } from "@/lib/db";

export async function getExternalVerificationStatus(caseId: string) {
  const c = await prisma.verificationCase.findUnique({
    where: { id: caseId },
    select: { status: true, trustLevel: true, readinessLevel: true, updatedAt: true },
  });
  if (!c) return null;
  return {
    status: c.status,
    trustLevel: c.trustLevel,
    readinessLevel: c.readinessLevel,
    updatedAt: c.updatedAt.toISOString(),
  };
}
