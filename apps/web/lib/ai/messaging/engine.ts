import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { gateAutopilotRecommendation } from "@/lib/ai/autopilot/autopilot-gate";
import { MessagingService } from "@/lib/bnhub/services/messaging-service";
import { createBnhubMobileNotification } from "@/lib/bnhub/mobile-push";
import {
  mergeGuestMessageTriggers,
  type GuestMessageTriggerKey,
} from "@/lib/ai/messaging/trigger-config";
import {
  PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION,
  renderHostLifecycleTemplate,
  resolveTemplateLocale,
  type HostLifecycleTemplateKey,
  type MessageTemplateLocale,
} from "@/lib/ai/messaging/templates";

export type LifecycleTriggerType =
  | GuestMessageTriggerKey
  | "host_checklist_pre"
  | "host_checklist_post";

const TRIGGER_TO_TEMPLATE: Record<GuestMessageTriggerKey, HostLifecycleTemplateKey> = {
  booking_confirmed: "booking_confirmation",
  pre_checkin: "pre_checkin",
  checkin: "checkin_welcome",
  checkout: "checkout_reminder",
  post_checkout: "post_stay_thank_you",
};

function formatDateLabel(d: Date, locale: MessageTemplateLocale): string {
  const loc = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US";
  return new Intl.DateTimeFormat(loc, { dateStyle: "medium" }).format(d);
}

function guestFirst(name: string | null | undefined): string {
  const t = name?.trim();
  if (!t) return "Guest";
  return t.split(/\s+/)[0] ?? "Guest";
}

async function alreadyLogged(bookingId: string, triggerType: string): Promise<boolean> {
  const hit = await prisma.bnhubAutomatedHostMessageLog.findFirst({
    where: { bookingId, triggerType },
    select: { id: true },
  });
  return Boolean(hit);
}

async function appendLog(input: {
  bookingId: string;
  hostId: string;
  guestId: string;
  listingId: string;
  messageType: string;
  triggerType: string;
  locale: string;
  content: string;
  status: "draft" | "sent" | "suppressed";
  recipient: "guest" | "host_internal";
  metadataJson?: Prisma.InputJsonValue;
}) {
  await prisma.bnhubAutomatedHostMessageLog.create({
    data: {
      bookingId: input.bookingId,
      hostId: input.hostId,
      guestId: input.guestId,
      listingId: input.listingId,
      messageType: input.messageType,
      triggerType: input.triggerType,
      locale: input.locale,
      content: input.content,
      status: input.status,
      recipient: input.recipient,
      metadataJson: input.metadataJson === undefined ? undefined : (input.metadataJson as object),
    },
  });
}

/**
 * Host-controlled BNHUB lifecycle messaging. Does not override safety rules; logs all attempts.
 */
export async function runHostLifecycleMessage(input: {
  bookingId: string;
  trigger: LifecycleTriggerType;
}): Promise<{ ok: boolean; skippedReason?: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      listing: { select: { id: true, title: true, ownerId: true } },
      guest: { select: { id: true, name: true } },
    },
  });
  if (!booking) return { ok: false, skippedReason: "booking_not_found" };

  if (input.trigger === "booking_confirmed" && booking.status !== "CONFIRMED") {
    return { ok: false, skippedReason: "booking_status" };
  }

  const hostId = booking.listing.ownerId;
  const row = await prisma.managerAiHostAutopilotSettings.findUnique({
    where: { userId: hostId },
  });
  if (!row) return { ok: false, skippedReason: "no_settings" };

  const triggers = mergeGuestMessageTriggers(row.guestMessageTriggersJson);
  const isInternal = input.trigger === "host_checklist_pre" || input.trigger === "host_checklist_post";

  if (isInternal) {
    if (!row.hostInternalChecklistEnabled) return { ok: false, skippedReason: "internal_disabled" };
    if (await alreadyLogged(booking.id, input.trigger)) return { ok: false, skippedReason: "deduped" };

    const hostUser = await prisma.user.findUnique({
      where: { id: hostId },
      select: { preferredUiLocale: true },
    });
    const loc = resolveTemplateLocale(hostUser?.preferredUiLocale);
    const templateKey: HostLifecycleTemplateKey =
      input.trigger === "host_checklist_pre" ? "host_checklist_pre" : "host_checklist_post";
    const body = renderHostLifecycleTemplate(templateKey, loc, {
      guestName: guestFirst(booking.guest.name),
      listingTitle: booking.listing.title,
      checkInLabel: formatDateLabel(booking.checkIn, loc),
      checkOutLabel: formatDateLabel(booking.checkOut, loc),
      nights: booking.nights,
    });

    await createBnhubMobileNotification({
      userId: hostId,
      type: NotificationType.SYSTEM,
      title: "BNHUB checklist (internal)",
      message: `${body}\n\n— ${PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION}`,
      actionUrl: `/bnhub/booking/${booking.id}`,
      actionLabel: "Open booking",
      listingId: booking.listingId,
      metadata: {
        kind: "bnhub_host_internal_checklist",
        bookingId: booking.id,
        trigger: input.trigger,
      } as Prisma.InputJsonValue,
    });

    await appendLog({
      bookingId: booking.id,
      hostId,
      guestId: booking.guestId,
      listingId: booking.listingId,
      messageType: templateKey,
      triggerType: input.trigger,
      locale: loc,
      content: body,
      status: "sent",
      recipient: "host_internal",
      metadataJson: { disclaimer: PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION },
    });
    return { ok: true };
  }

  if (!row.autoGuestMessagingEnabled) {
    return { ok: false, skippedReason: "guest_messaging_disabled" };
  }

  const guestKey = input.trigger as GuestMessageTriggerKey;
  if (!triggers[guestKey]?.enabled) {
    return { ok: false, skippedReason: "trigger_disabled" };
  }

  if (await alreadyLogged(booking.id, input.trigger)) {
    return { ok: false, skippedReason: "deduped" };
  }

  const hostUser = await prisma.user.findUnique({
    where: { id: hostId },
    select: { preferredUiLocale: true },
  });
  const loc = resolveTemplateLocale(hostUser?.preferredUiLocale);
  const templateKey = TRIGGER_TO_TEMPLATE[guestKey];
  const variables = {
    guestName: guestFirst(booking.guest.name),
    listingTitle: booking.listing.title,
    checkInLabel: formatDateLabel(booking.checkIn, loc),
    checkOutLabel: formatDateLabel(booking.checkOut, loc),
    nights: booking.nights,
  };
  const body = renderHostLifecycleTemplate(templateKey, loc, variables);

  const mode = row.guestMessageMode === "auto_send_safe" ? "auto_send_safe" : "draft_only";
  const ruleName = `bnhub_host_lifecycle_${input.trigger}`;

  if (mode === "draft_only") {
    await prisma.managerAiRecommendation.create({
      data: {
        userId: hostId,
        agentKey: `bnhub_lifecycle_${input.trigger}`,
        title: `Guest message draft: ${input.trigger.replace(/_/g, " ")}`,
        description: PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION,
        targetEntityType: "booking",
        targetEntityId: booking.id,
        confidence: 0.85,
        suggestedAction: body,
        payload: {
          kind: "host_lifecycle_guest_message",
          trigger: input.trigger,
          body,
          disclaimer: PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION,
        } as object,
      },
    });

    await createBnhubMobileNotification({
      userId: hostId,
      type: NotificationType.SYSTEM,
      title: "Message draft ready",
      message: `A guest message draft is ready for booking ${booking.id.slice(0, 8)}… — ${PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION}`,
      actionUrl: `/bnhub/booking/${booking.id}`,
      actionLabel: "Review booking",
      listingId: booking.listingId,
      metadata: { bookingId: booking.id, kind: "bnhub_lifecycle_draft" } as Prisma.InputJsonValue,
    });

    await appendLog({
      bookingId: booking.id,
      hostId,
      guestId: booking.guestId,
      listingId: booking.listingId,
      messageType: templateKey,
      triggerType: input.trigger,
      locale: loc,
      content: body,
      status: "draft",
      recipient: "guest",
      metadataJson: { mode: "draft_only", disclaimer: PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION },
    });
    return { ok: true };
  }

  const gate = await gateAutopilotRecommendation({
    ruleName,
    hostId,
    listingId: booking.listingId,
    baseConfidence: 0.78,
    logActionKey: `bnhub_host_lifecycle_${input.trigger}`,
    targetEntityType: "booking",
    targetEntityId: booking.id,
    logPayloadExtra: { trigger: input.trigger },
  });

  if (!gate.ok) {
    await appendLog({
      bookingId: booking.id,
      hostId,
      guestId: booking.guestId,
      listingId: booking.listingId,
      messageType: templateKey,
      triggerType: input.trigger,
      locale: loc,
      content: body,
      status: "suppressed",
      recipient: "guest",
      metadataJson: { gate: gate.suppressionReason },
    });
    return { ok: false, skippedReason: "gate_blocked" };
  }

  try {
    await MessagingService.sendMessage(booking.id, hostId, body);
  } catch (e) {
    console.warn("[host-lifecycle] send failed", e);
    await appendLog({
      bookingId: booking.id,
      hostId,
      guestId: booking.guestId,
      listingId: booking.listingId,
      messageType: templateKey,
      triggerType: input.trigger,
      locale: loc,
      content: body,
      status: "suppressed",
      recipient: "guest",
      metadataJson: { error: String(e) },
    });
    return { ok: false, skippedReason: "send_failed" };
  }

  await appendLog({
    bookingId: booking.id,
    hostId,
    guestId: booking.guestId,
    listingId: booking.listingId,
    messageType: templateKey,
    triggerType: input.trigger,
    locale: loc,
    content: body,
    status: "sent",
    recipient: "guest",
    metadataJson: { mode: "auto_send_safe", decisionScore: gate.decisionScore },
  });

  return { ok: true };
}
