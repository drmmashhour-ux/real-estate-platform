import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export type TestimonialPromptReason = "first_purchase" | "first_lead_interaction";

/**
 * One-time: after first lead unlock payment or first CRM outbound message, brokers become eligible
 * to see the “How was your experience?” prompt (until they submit or dismiss).
 */
export async function markBrokerTestimonialEligible(
  brokerId: string,
  _reason: TestimonialPromptReason
): Promise<void> {
  const uid = brokerId?.trim();
  if (!uid) return;

  const [user, existingSubmitted] = await Promise.all([
    prisma.user.findUnique({
      where: { id: uid },
      select: { role: true, brokerTestimonialPromptEligibleAt: true },
    }),
    prisma.testimonial.findFirst({ where: { brokerId: uid }, select: { id: true } }),
  ]);

  if (!user || user.role !== PlatformRole.BROKER) return;
  if (existingSubmitted) return;
  if (user.brokerTestimonialPromptEligibleAt) return;

  await prisma.user.update({
    where: { id: uid },
    data: { brokerTestimonialPromptEligibleAt: new Date() },
  });
}

export async function listPublicApprovedTestimonials(limit = 12) {
  return prisma.testimonial.findMany({
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, name: true, city: true, quote: true, rating: true, createdAt: true },
  });
}

export async function listPendingTestimonials() {
  return prisma.testimonial.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "desc" },
    include: { broker: { select: { id: true, email: true } } },
  });
}

export async function approveTestimonial(id: string, isApproved: boolean) {
  return prisma.testimonial.update({
    where: { id },
    data: { isApproved },
  });
}
