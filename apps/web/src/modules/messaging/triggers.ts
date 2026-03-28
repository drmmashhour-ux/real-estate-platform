import { prisma } from "@/lib/db";
import {
  markHighIntentForOpenConversation,
  updateOutcomeForOpenConversation,
} from "@/src/modules/messaging/outcomes";
import {
  isMessagingAutomationEnabled,
  sendTemplatedUserMessage,
  scheduleFollowUp,
} from "@/src/services/messaging";
import { touchGrowthAiContext } from "@/src/services/growthAiAutoReply";

async function varsForUser(userId: string, extra: Record<string, string> = {}) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const name = u?.name?.trim() || u?.email?.split("@")[0] || "there";
  return { name, city: extra.city ?? "your area", ...extra };
}

async function recentTriggerCount(userId: string, triggerEvent: string, hours = 24): Promise<number> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return prisma.messageLog.count({
    where: { userId, triggerEvent, sentAt: { gte: since } },
  });
}

export async function onMessagingTriggerSignup(userId: string): Promise<void> {
  if (!isMessagingAutomationEnabled()) return;
  const vars = await varsForUser(userId);
  const seg = (await prisma.user.findUnique({ where: { id: userId }, select: { growthOutreachSegment: true } }))
    ?.growthOutreachSegment;
  const segment = seg && ["warm", "buyer", "broker", "host"].includes(seg) ? seg : "warm";
  const r = await sendTemplatedUserMessage(userId, segment, "first_message", vars, { triggerEvent: "signup" });
  if (r.ok) await scheduleFollowUp(userId, 24);
}

export async function onMessagingTriggerListingView(userId: string, city?: string): Promise<void> {
  void touchGrowthAiContext(userId, {
    last_action: "listing_view",
    flow_hint: "buyer",
    ...(city ? { city } : {}),
  });
  if (!isMessagingAutomationEnabled()) return;
  if ((await recentTriggerCount(userId, "listing_view")) >= 1) return;
  const vars = await varsForUser(userId, city ? { city } : {});
  const r = await sendTemplatedUserMessage(userId, "warm", "force_action", vars, { triggerEvent: "listing_view" });
  if (r.ok) await scheduleFollowUp(userId, 24);
}

export async function onMessagingTriggerInquiry(userId: string): Promise<void> {
  void touchGrowthAiContext(userId, { last_action: "inquiry", flow_hint: "buyer" });
  void updateOutcomeForOpenConversation(userId, "inquiry_sent").catch(() => {});
  if (!isMessagingAutomationEnabled()) return;
  if ((await recentTriggerCount(userId, "inquiry_sent")) >= 1) return;
  const vars = await varsForUser(userId);
  await sendTemplatedUserMessage(userId, "buyer", "conversion_push", vars, { triggerEvent: "inquiry_sent" });
}

export async function onMessagingTriggerCheckoutStarted(userId: string): Promise<void> {
  void touchGrowthAiContext(userId, { last_action: "checkout_started", flow_hint: "booking" });
  void markHighIntentForOpenConversation(userId).catch(() => {});
  if (!isMessagingAutomationEnabled()) return;
  if ((await recentTriggerCount(userId, "checkout_started")) >= 1) return;
  const vars = await varsForUser(userId);
  await sendTemplatedUserMessage(userId, "buyer", "conversion_push", vars, { triggerEvent: "checkout_started" });
}

/** BNHub / booking payment confirmed — funnel outcome. */
export async function onGrowthAiCheckoutCompleted(userId: string): Promise<void> {
  await updateOutcomeForOpenConversation(userId, "checkout_completed");
}

/** Optional: call when a human call is booked for this user. */
export async function onGrowthAiCallScheduled(userId: string): Promise<void> {
  await updateOutcomeForOpenConversation(userId, "call_scheduled");
}
