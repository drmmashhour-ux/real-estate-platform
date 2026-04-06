import { GrowthEmailQueueType, GrowthEmailQueueStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertBrokerCanReceiveNewLead } from "@/modules/billing/brokerLeadBilling";
import { trackEvent } from "./analytics";
import { createLead } from "./crm";
import { getNotificationEmail, sendEmail } from "@/lib/email/resend";

const HOUR_MS = 60 * 60 * 1000;

function scheduleAt(msFromNow: number) {
  return new Date(Date.now() + msFromNow);
}

export async function onSignupAutomation(userId: string): Promise<void> {
  await prisma.growthEmailQueue.create({
    data: {
      userId,
      type: GrowthEmailQueueType.WELCOME,
      status: GrowthEmailQueueStatus.PENDING,
      scheduledAt: new Date(),
      payload: { trigger: "signup" } as object,
    },
  });
}

export type InquiryAutomationInput = {
  userId?: string | null;
  listingId?: string | null;
  shortTermListingId?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  brokerId?: string | null;
};

export async function onInquiryAutomation(input: InquiryAutomationInput): Promise<{ leadId: string }> {
  const lead = await createLead({
    userId: input.userId,
    listingId: input.listingId,
    shortTermListingId: input.shortTermListingId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    message: input.message,
    leadSource: "inquiry_automation",
  });

  await trackEvent(
    "generate_lead",
    { leadId: lead.id, listingId: input.listingId ?? input.shortTermListingId },
    { userId: input.userId }
  );

  if (input.brokerId) {
    const gate = await assertBrokerCanReceiveNewLead(prisma, input.brokerId);
    if (gate.ok) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { introducedByBrokerId: input.brokerId },
      });
    }
    const to = getNotificationEmail();
    if (to) {
      void sendEmail({
        to,
        subject: `New inquiry — lead ${lead.id}`,
        html: `<p>A new lead was created for listing context.</p><p>Lead: ${lead.id}</p>`,
      }).catch(() => {});
    }
  }

  return { leadId: lead.id };
}

export async function onCheckoutStartAutomation(userId: string, metadata: Record<string, unknown>): Promise<void> {
  await prisma.growthEmailQueue.create({
    data: {
      userId,
      type: GrowthEmailQueueType.REMINDER,
      status: GrowthEmailQueueStatus.PENDING,
      scheduledAt: scheduleAt(HOUR_MS),
      payload: { kind: "abandoned_1h", ...metadata } as object,
    },
  });
  await prisma.growthEmailQueue.create({
    data: {
      userId,
      type: GrowthEmailQueueType.REMINDER,
      status: GrowthEmailQueueStatus.PENDING,
      scheduledAt: scheduleAt(24 * HOUR_MS),
      payload: { kind: "abandoned_24h", ...metadata } as object,
    },
  });
}

export async function onPaymentSuccessAutomation(
  userId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await prisma.growthEmailQueue.create({
    data: {
      userId,
      type: GrowthEmailQueueType.FOLLOWUP,
      status: GrowthEmailQueueStatus.PENDING,
      scheduledAt: scheduleAt(3 * HOUR_MS),
      payload: { kind: "review_request", ...metadata } as object,
    },
  });
}

export async function onPaymentFailedAutomation(
  userId: string | undefined,
  metadata: Record<string, unknown>
): Promise<void> {
  await trackEvent("payment_failed", metadata, { userId: userId ?? null });
}
