import { prisma } from "@/lib/db";

const STEPS = [
  "fully_signed",
  "conditions_completed",
  "notary_assigned",
  "deed_prepared",
  "appointment_scheduled",
  "closing_completed",
  "archived",
] as const;

export async function getClosingTimeline(dealId: string) {
  const [deal, notary, session, conditions] = await Promise.all([
    prisma.deal.findUnique({
      where: { id: dealId },
      select: { lecipmExecutionPipelineState: true, updatedAt: true },
    }),
    prisma.dealNotaryCoordination.findUnique({ where: { dealId } }),
    prisma.signatureSession.findFirst({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      select: { status: true, updatedAt: true },
    }),
    prisma.dealClosingCondition.findMany({ where: { dealId } }),
  ]);

  const fulfilled = conditions.filter((c) => c.status === "fulfilled").length;
  const total = conditions.length;

  const steps = STEPS.map((key) => {
    let done = false;
    let at: Date | null = null;
    if (key === "fully_signed") {
      done = session?.status === "completed";
      at = done ? session?.updatedAt ?? null : null;
    }
    if (key === "conditions_completed") {
      done = total === 0 || fulfilled === total;
    }
    if (key === "notary_assigned") {
      done = Boolean(notary?.notaryId);
      at = notary?.selectedAt ?? null;
    }
    if (key === "deed_prepared") {
      done = notary?.packageStatus === "ready" || notary?.packageStatus === "completed";
    }
    if (key === "appointment_scheduled") {
      done = Boolean(notary?.appointmentAt);
      at = notary?.appointmentAt ?? null;
    }
    if (key === "closing_completed") {
      done = deal?.lecipmExecutionPipelineState === "closed" || deal?.lecipmExecutionPipelineState === "archived";
      at = done ? deal?.updatedAt ?? null : null;
    }
    if (key === "archived") {
      done = deal?.lecipmExecutionPipelineState === "archived";
    }
    return { key, done, at };
  });

  return { steps, pipelineState: deal?.lecipmExecutionPipelineState ?? null };
}
