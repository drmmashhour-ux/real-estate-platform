import { prisma } from "@/lib/db";
import type { CreateHostLeadInput, ListingImportInput, OnboardingStepInput } from "./onboarding.types";

export async function createHostLead(input: CreateHostLeadInput) {
  return prisma.hostLead.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      city: input.city,
      propertyType: input.propertyType,
      listingUrl: input.listingUrl,
      source: input.source ?? "host_landing",
      sourceDetail: input.sourceDetail,
      estimatedRevenueCents: input.estimatedRevenueCents,
      userId: input.userId ?? undefined,
      funnelStatus: "lead_created",
    },
  });
}

export async function updateHostLeadStatus(leadId: string, funnelStatus: string) {
  return prisma.hostLead.update({
    where: { id: leadId },
    data: { funnelStatus },
  });
}

export async function startOnboardingSession(opts: { leadId?: string | null; userId?: string | null }) {
  return prisma.hostOnboardingSession.create({
    data: {
      leadId: opts.leadId ?? undefined,
      userId: opts.userId ?? undefined,
      status: "active",
      stepKey: "property_basics",
      data: {},
    },
  });
}

export async function saveOnboardingStep(input: OnboardingStepInput) {
  const session = await prisma.hostOnboardingSession.findUnique({ where: { id: input.sessionId } });
  if (!session) return null;
  const prev = (session.data as Record<string, unknown>) ?? {};
  const merged = { ...prev, [input.stepKey]: input.data };
  return prisma.hostOnboardingSession.update({
    where: { id: input.sessionId },
    data: {
      stepKey: input.stepKey,
      data: merged as object,
      updatedAt: new Date(),
    },
  });
}

export async function submitListingImport(input: ListingImportInput) {
  return prisma.hostListingImport.create({
    data: {
      leadId: input.leadId ?? undefined,
      userId: input.userId ?? undefined,
      sourcePlatform: input.sourcePlatform,
      sourceUrl: input.sourceUrl,
      status: "pending_manual_review",
      parsedData: {
        note: "Automated parsing not guaranteed — URL stored for host success review.",
      },
    },
  });
}

export async function completeOnboarding(sessionId: string) {
  const s = await prisma.hostOnboardingSession.update({
    where: { id: sessionId },
    data: { status: "completed", stepKey: "done" },
  });
  if (s.leadId) {
    await prisma.hostLead.update({
      where: { id: s.leadId },
      data: { funnelStatus: "onboarding_completed" },
    }).catch(() => {});
  }
  return s;
}

export async function getOnboardingSession(sessionId: string) {
  return prisma.hostOnboardingSession.findUnique({
    where: { id: sessionId },
    include: { lead: true },
  });
}
