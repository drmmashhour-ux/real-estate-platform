import { prisma } from "@/lib/db";

export async function getLatestSignatureSummary(dealId: string) {
  const session = await prisma.signatureSession.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    include: { participants: true },
  });
  if (!session) return null;
  const signed = session.participants.filter((p) => p.status === "signed").length;
  const total = session.participants.length;
  return {
    sessionId: session.id,
    status: session.status,
    provider: session.provider,
    signedCount: signed,
    participantCount: total,
    participants: session.participants,
  };
}

export async function markParticipantSigned(sessionId: string, participantId: string) {
  await prisma.signatureParticipant.update({
    where: { id: participantId },
    data: { status: "signed", signedAt: new Date() },
  });
  const session = await prisma.signatureSession.findUnique({
    where: { id: sessionId },
    include: { participants: true },
  });
  if (!session) return;
  const allSigned = session.participants.every((p) => p.id === participantId || p.status === "signed");
  const anySigned = session.participants.some((p) => p.status === "signed");
  let nextStatus = session.status;
  if (allSigned) nextStatus = "completed";
  else if (anySigned) nextStatus = "in_progress";
  await prisma.signatureSession.update({
    where: { id: sessionId },
    data: { status: nextStatus },
  });
}
