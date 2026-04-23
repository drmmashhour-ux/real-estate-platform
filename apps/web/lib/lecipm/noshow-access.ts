import { prisma } from "@/lib/db";

export async function assertNoShowVisitAccess(input: {
  userId: string;
  visitId: string;
}): Promise<{ ok: true; visit: { id: string; leadId: string; brokerUserId: string } } | { ok: false; status: number; error: string }> {
  const v = await prisma.lecipmVisit.findUnique({
    where: { id: input.visitId },
    select: { id: true, leadId: true, brokerUserId: true },
  });
  if (!v) {
    return { ok: false, status: 404, error: "Visit not found" };
  }
  if (v.brokerUserId === input.userId) {
    return { ok: true, visit: v };
  }
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { role: true } });
  if (user?.role === "ADMIN") {
    return { ok: true, visit: v };
  }
  const lead = await prisma.lead.findFirst({
    where: { id: v.leadId, userId: input.userId },
    select: { id: true },
  });
  if (lead) {
    return { ok: true, visit: v };
  }
  return { ok: false, status: 403, error: "Not allowed" };
}
