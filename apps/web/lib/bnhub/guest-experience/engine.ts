import { ListingStatus, NotificationType, Prisma } from "@prisma/client";
import { addHours, subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { getHostAutopilotConfig } from "@/lib/ai/autopilot/host-config";
import { gateAutopilotRecommendation } from "@/lib/ai/autopilot/autopilot-gate";
import { MessagingService } from "@/lib/bnhub/services/messaging-service";
import { createBnhubMobileNotification } from "@/lib/bnhub/mobile-push";
import { sendEmail } from "@/lib/email/send";
import {
  GATE_RULE_REPEAT_NUDGE,
  GATE_RULE_REVIEW_REMINDER,
  GATE_RULE_REVIEW_REQUEST,
} from "./constants";
import { bnhubGuestMessagingDelivery } from "./messaging-mode";
import { computePositiveExperienceSignals } from "./positive-experience";
import {
  getGuestExperienceOutcomeCreatedAt,
  hasGuestExperienceOutcome,
  logGuestExperienceOutcome,
} from "./log-signal";
import {
  reviewRequestDelayHours,
  shouldHardBlockGuestExperience,
} from "./suppression";
import { buildRepeatBookingNudgeBody, buildReviewReminderBody, buildReviewRequestBody } from "./templates";

const META_KIND = "bnhub_guest_experience_v1";

async function similarListings(listingId: string, city: string, ownerId: string) {
  return prisma.shortTermListing.findMany({
    where: {
      city,
      ownerId,
      id: { not: listingId },
      listingStatus: ListingStatus.PUBLISHED,
    },
    take: 2,
    select: { id: true, title: true },
  });
}

async function notifyGuestPlatform(input: {
  guestId: string;
  listingId: string;
  bookingId: string;
  title: string;
  message: string;
  actionUrl: string;
  phase: "review_request" | "review_reminder" | "repeat_nudge";
}) {
  await createBnhubMobileNotification({
    userId: input.guestId,
    type: NotificationType.REMINDER,
    title: input.title,
    message: input.message,
    listingId: input.listingId,
    actionUrl: input.actionUrl,
    actionLabel: input.phase === "repeat_nudge" ? "Browse" : "Leave a review",
    metadata: {
      bookingId: input.bookingId,
      kind: META_KIND,
      phase: input.phase,
    } as Prisma.InputJsonValue,
    pushData: {
      kind: input.phase,
      bookingId: input.bookingId,
      listingId: input.listingId,
    },
  });
}

async function maybeEmailGuest(email: string | null | undefined, name: string | null, html: string) {
  if (!email?.trim()) return;
  await sendEmail({
    to: email,
    subject: "How was your BNHUB stay?",
    html,
  });
}

export type RunBnhubGuestExperienceResult = {
  scanned: number;
  reviewRequests: number;
  reminders: number;
  repeatNudges: number;
  suppressed: number;
  skipped: number;
};

/**
 * Cron-driven guest experience: timed review asks, one soft reminder, repeat-stay nudge.
 * Respects host autopilot messaging mode and decision-engine gate (no unsafe auto-send).
 */
export async function runBnhubGuestExperienceEngine(
  opts?: { limit?: number }
): Promise<RunBnhubGuestExperienceResult> {
  const now = new Date();
  const limit = Math.min(500, Math.max(1, opts?.limit ?? 200));
  const result: RunBnhubGuestExperienceResult = {
    scanned: 0,
    reviewRequests: 0,
    reminders: 0,
    repeatNudges: 0,
    suppressed: 0,
    skipped: 0,
  };

  const bookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      checkOut: { gte: subDays(now, 45) },
    },
    take: limit,
    orderBy: { checkOut: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          ownerId: true,
        },
      },
      guest: { select: { id: true, name: true, email: true } },
      bookingIssues: { select: { status: true } },
      checkinDetails: { select: { instructions: true, keyInfo: true } },
      review: { select: { id: true } },
    },
  });

  for (const b of bookings) {
    result.scanned += 1;
    const hostId = b.listing.ownerId;
    const delivery = bnhubGuestMessagingDelivery(await getHostAutopilotConfig(hostId));

    const { positiveExperience, reasons } = computePositiveExperienceSignals({
      booking: b,
      issues: b.bookingIssues,
      checkinDetails: b.checkinDetails,
    });

    const hard = await shouldHardBlockGuestExperience({
      prisma,
      bookingId: b.id,
      guestId: b.guestId,
      now,
    });
    if (hard.block) {
      result.skipped += 1;
      continue;
    }

    const delayH =
      reviewRequestDelayHours(b.id, positiveExperience) + hard.delayExtraHours;
    const eligibleAt = addHours(b.checkOut, delayH);

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const reviewUrl = `${baseUrl}/bnhub/listings/${b.listingId}`;
    const bookingUrl = `${baseUrl}/bnhub/booking/${b.id}`;
    const hSince = (now.getTime() - b.checkOut.getTime()) / (60 * 60 * 1000);

    const sentRequest = await hasGuestExperienceOutcome(b.id, "review_request_sent");

    // --- Phase 1: review request (6–12h + issue delay after checkout) ---
    if (!sentRequest && now >= eligibleAt && !b.review) {
      const gate = await gateAutopilotRecommendation({
        ruleName: GATE_RULE_REVIEW_REQUEST,
        hostId,
        listingId: b.listingId,
        baseConfidence: positiveExperience ? 0.82 : 0.7,
        logActionKey: "bnhub_guest_experience_review_request",
        targetEntityType: "booking",
        targetEntityId: b.id,
        logPayloadExtra: { positiveExperience, reasons },
      });
      if (!gate.ok) {
        result.suppressed += 1;
        continue;
      }

      const body = buildReviewRequestBody({
        guestName: b.guest.name,
        listingTitle: b.listing.title,
        nights: b.nights,
      });

      if (delivery === "auto_send_safe") {
        try {
          await MessagingService.sendMessage(b.id, hostId, body);
        } catch (e) {
          console.warn("[guest-experience] host message failed", e);
        }
      } else if (delivery === "draft_only") {
        await prisma.managerAiRecommendation.create({
          data: {
            userId: hostId,
            agentKey: "bnhub_guest_review_request_draft",
            title: "Suggested message: thank guest & ask for feedback",
            description:
              "Safe template for the booking thread. Sending is up to you — the platform also nudges the guest with a neutral reminder.",
            targetEntityType: "booking",
            targetEntityId: b.id,
            confidence: gate.confidence,
            suggestedAction: body,
            payload: {
              kind: "guest_message_draft",
              bookingId: b.id,
              template: "review_request",
              body,
            } as object,
          },
        });
      }

      await notifyGuestPlatform({
        guestId: b.guestId,
        listingId: b.listingId,
        bookingId: b.id,
        title: "How was your stay?",
        message: `Thank you for your stay. We'd love your feedback. ${reviewUrl}`,
        actionUrl: reviewUrl,
        phase: "review_request",
      });

      await maybeEmailGuest(
        b.guest.email,
        b.guest.name,
        `<p>Hi ${(b.guest.name ?? "there").split(/\s+/)[0]},</p><p>Thank you for your stay. We'd love your feedback when you have a moment.</p><p><a href="${reviewUrl}">Leave a review</a></p>`
      );

      await logGuestExperienceOutcome({
        hostId,
        listingId: b.listingId,
        bookingId: b.id,
        guestId: b.guestId,
        outcomeType: "review_request_sent",
        metadata: {
          positiveExperience,
          deliveryMode: delivery,
          decisionScore: gate.decisionScore,
        },
      });
      result.reviewRequests += 1;
      continue;
    }

    // --- Phase 2: single reminder 48h after review request if still no review ---
    if (sentRequest && !b.review) {
      const reminderSent = await hasGuestExperienceOutcome(b.id, "review_request_reminder_sent");
      const firstSentAt = await getGuestExperienceOutcomeCreatedAt(b.id, "review_request_sent");
      if (!reminderSent && firstSentAt) {
        const reminderDue = addHours(firstSentAt, 48);
        if (now >= reminderDue) {
          const gate = await gateAutopilotRecommendation({
            ruleName: GATE_RULE_REVIEW_REMINDER,
            hostId,
            listingId: b.listingId,
            baseConfidence: 0.68,
            logActionKey: "bnhub_guest_experience_review_reminder",
            targetEntityType: "booking",
            targetEntityId: b.id,
          });
          if (!gate.ok) {
            result.suppressed += 1;
            continue;
          }

          await logGuestExperienceOutcome({
            hostId,
            listingId: b.listingId,
            bookingId: b.id,
            guestId: b.guestId,
            outcomeType: "review_ignored",
            metadata: { phase: "before_soft_reminder" },
          });

          const remBody = buildReviewReminderBody({
            guestName: b.guest.name,
            listingTitle: b.listing.title,
          });

          if (delivery === "auto_send_safe") {
            try {
              await MessagingService.sendMessage(b.id, hostId, remBody);
            } catch {
              /* fall through to platform */
            }
          } else if (delivery === "draft_only") {
            await prisma.managerAiRecommendation.create({
              data: {
                userId: hostId,
                agentKey: "bnhub_guest_review_reminder_draft",
                title: "Suggested: gentle review reminder",
                description: "Optional message draft for the booking thread.",
                targetEntityType: "booking",
                targetEntityId: b.id,
                confidence: gate.confidence,
                suggestedAction: remBody,
                payload: { kind: "guest_message_draft", bookingId: b.id, template: "review_reminder" } as object,
              },
            });
          }

          await notifyGuestPlatform({
            guestId: b.guestId,
            listingId: b.listingId,
            bookingId: b.id,
            title: "Quick reminder",
            message: `Just a quick reminder to share your experience. ${reviewUrl}`,
            actionUrl: reviewUrl,
            phase: "review_reminder",
          });

          await logGuestExperienceOutcome({
            hostId,
            listingId: b.listingId,
            bookingId: b.id,
            guestId: b.guestId,
            outcomeType: "review_request_reminder_sent",
            metadata: { decisionScore: gate.decisionScore },
          });
          result.reminders += 1;
          continue;
        }
      }
    }

    // --- Phase 3: repeat booking nudge ~2–5 days after checkout (after review pipeline had a chance) ---
    const nudgeSent = await hasGuestExperienceOutcome(b.id, "repeat_booking_nudge_sent");
    const reviewPipelineDone = Boolean(sentRequest) || Boolean(b.review) || hSince >= 96;
    if (!nudgeSent && reviewPipelineDone) {
      const minH = 48;
      const maxH = 120;
      if (hSince >= minH && hSince <= maxH) {
        const gate = await gateAutopilotRecommendation({
          ruleName: GATE_RULE_REPEAT_NUDGE,
          hostId,
          listingId: b.listingId,
          baseConfidence: 0.72,
          logActionKey: "bnhub_guest_experience_repeat_nudge",
          targetEntityType: "booking",
          targetEntityId: b.id,
        });
        if (!gate.ok) {
          result.suppressed += 1;
          continue;
        }

        const sim = await similarListings(b.listingId, b.listing.city, hostId);
        const nudgeBody = buildRepeatBookingNudgeBody({
          guestName: b.guest.name,
          listingTitle: b.listing.title,
          listingUrl: bookingUrl,
          similarUrls: sim.map((s) => ({
            title: s.title,
            url: `${baseUrl}/bnhub/listings/${s.id}`,
          })),
        });

        if (delivery === "auto_send_safe") {
          try {
            await MessagingService.sendMessage(b.id, hostId, nudgeBody);
          } catch {
            /* platform only */
          }
        } else if (delivery === "draft_only") {
          await prisma.managerAiRecommendation.create({
            data: {
              userId: hostId,
              agentKey: "bnhub_guest_repeat_nudge_draft",
              title: "Suggested: invite guest to return",
              description: "Optional follow-up draft — safe, non-promotional tone.",
              targetEntityType: "booking",
              targetEntityId: b.id,
              confidence: gate.confidence,
              suggestedAction: nudgeBody,
              payload: { kind: "guest_message_draft", bookingId: b.id, template: "repeat_nudge" } as object,
            },
          });
        }

        await notifyGuestPlatform({
          guestId: b.guestId,
          listingId: b.listingId,
          bookingId: b.id,
          title: "Visit again soon",
          message: `We’d be happy to host you again in the future. ${bookingUrl}`,
          actionUrl: bookingUrl,
          phase: "repeat_nudge",
        });

        await logGuestExperienceOutcome({
          hostId,
          listingId: b.listingId,
          bookingId: b.id,
          guestId: b.guestId,
          outcomeType: "repeat_booking_nudge_sent",
          metadata: { decisionScore: gate.decisionScore },
        });
        result.repeatNudges += 1;
      }
    }
  }

  return result;
}
