import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { sendEmail } from "@/lib/email/resend";
import { recordMatchingEvent } from "@/modules/senior-living/matching-events.service";
import { applyPositiveConversionLearning, scoreSeniorLead } from "@/modules/senior-living/lead-scoring.service";

const TAG = "[senior.lead]";

export async function createSeniorLead(input: {
  residenceId: string;
  requesterName: string;
  email: string;
  phone?: string | null;
  needsLevel?: string | null;
  budget?: number | null;
  familyUserId?: string | null;
  /** Match score shown when the family requested contact (for learning). */
  matchScore?: number | null;
}) {
  const lead = await prisma.seniorLead.create({
    data: {
      residenceId: input.residenceId,
      requesterName: input.requesterName.trim().slice(0, 256),
      email: input.email.trim().slice(0, 320),
      phone: input.phone?.trim().slice(0, 64) ?? null,
      needsLevel: input.needsLevel?.slice(0, 24) ?? null,
      budget: input.budget ?? undefined,
      familyUserId: input.familyUserId ?? null,
      status: "NEW",
    },
  });

  void recordMatchingEvent({
    userId: input.familyUserId ?? null,
    residenceId: input.residenceId,
    eventType: "LEAD",
    scoreAtTime: input.matchScore ?? null,
  }).catch(() => {});

  void scoreSeniorLead(lead.id, null).catch(() => {});

  await notifyOperatorOfLead(lead.id).catch(() => {});
  logInfo(TAG, { action: "create", leadId: lead.id });
  return lead;
}

async function notifyOperatorOfLead(leadId: string): Promise<void> {
  const row = await prisma.seniorLead.findUnique({
    where: { id: leadId },
    include: {
      residence: {
        include: { operator: { select: { email: true, name: true } } },
      },
    },
  });
  if (!row?.residence.operator?.email?.includes("@")) return;

  const subject = `[Senior Living] New visit request — ${row.residence.name}`;
  const html = `<p>A family requested contact for <strong>${row.residence.name}</strong>.</p>
<p><strong>Name:</strong> ${row.requesterName}<br/>
<strong>Email:</strong> ${row.email}<br/>
${row.phone ? `<strong>Phone:</strong> ${row.phone}<br/>` : ""}
${row.needsLevel ? `<strong>Needs:</strong> ${row.needsLevel}<br/>` : ""}
${row.budget != null ? `<strong>Budget:</strong> ${row.budget}<br/>` : ""}</p>`;

  await sendEmail({
    to: row.residence.operator.email,
    subject,
    html,
  });
}

export async function listLeadsForOperator(operatorUserId: string) {
  return prisma.seniorLead.findMany({
    where: { residence: { operatorId: operatorUserId } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      residence: { select: { id: true, name: true, city: true } },
    },
  });
}

export async function listLeadsForAdmin() {
  return prisma.seniorLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      residence: { select: { id: true, name: true, city: true, operatorId: true } },
    },
  });
}

export async function updateLeadStatus(id: string, status: string) {
  const prev = await prisma.seniorLead.findUnique({
    where: { id },
    select: { status: true, residenceId: true },
  });
  const updated = await prisma.seniorLead.update({
    where: { id },
    data: { status: status.slice(0, 24) },
  });

  const next = status.slice(0, 24).toUpperCase();
  const wasVisit = prev?.status?.toUpperCase() === "VISIT_BOOKED";
  const wasClosed = prev?.status?.toUpperCase() === "CLOSED";

  if (prev?.residenceId) {
    if (next === "VISIT_BOOKED" && !wasVisit) {
      void recordMatchingEvent({
        userId: null,
        residenceId: prev.residenceId,
        eventType: "VISIT",
      }).catch(() => {});
    }
    if (next === "CLOSED" && !wasClosed) {
      void recordMatchingEvent({
        userId: null,
        residenceId: prev.residenceId,
        eventType: "CONVERTED",
      }).catch(() => {});
      void applyPositiveConversionLearning().catch(() => {});
    }
  }

  return updated;
}
