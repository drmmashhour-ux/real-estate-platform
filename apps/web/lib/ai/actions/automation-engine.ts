import { prisma } from "@/lib/db";
import type { AutomationRuleKey } from "./automation-rules";
import { AUTOMATION_RULE_DEFINITIONS } from "./automation-rules";
import { assertPlatformAutomationGate } from "@/lib/ai/autonomy/autonomy-state";
import { AUTOMATION_RULE_DOMAIN } from "@/lib/ai/autonomy/rules";
import { logManagerAgentRun } from "../logger";

export type AutomationRunResult = {
  ruleKey: AutomationRuleKey;
  ok: boolean;
  createdRecommendations: number;
  error?: string;
};

async function ensureRuleRow(key: AutomationRuleKey, name: string, description: string, frequency: string) {
  await prisma.managerAiAutomationRule.upsert({
    where: { key },
    create: { key, name, description, frequency, enabled: true },
    update: { name, description, frequency },
  });
}

export async function runAutomationRule(ruleKey: AutomationRuleKey): Promise<AutomationRunResult> {
  const rule = await prisma.managerAiAutomationRule.findUnique({ where: { key: ruleKey } });
  if (rule && !rule.enabled) {
    return { ruleKey, ok: true, createdRecommendations: 0 };
  }

  const domain = AUTOMATION_RULE_DOMAIN[ruleKey];
  const gate = await assertPlatformAutomationGate(domain);
  if (!gate.ok) {
    return { ruleKey, ok: true, createdRecommendations: 0 };
  }

  let created = 0;
  try {
    switch (ruleKey) {
      case "listing_completion": {
        const drafts = await prisma.shortTermListing.findMany({
          where: { listingStatus: "DRAFT" },
          take: 25,
          select: {
            id: true,
            ownerId: true,
            title: true,
            description: true,
            nightPriceCents: true,
            maxGuests: true,
          },
        });
        for (const l of drafts) {
          const missing: string[] = [];
          if (!l.description?.trim()) missing.push("description");
          if (l.nightPriceCents <= 0) missing.push("price");
          if (!l.maxGuests || l.maxGuests < 1) missing.push("guests");
          if (missing.length === 0) continue;
          const exists = await prisma.managerAiRecommendation.findFirst({
            where: {
              userId: l.ownerId,
              targetEntityType: "short_term_listing",
              targetEntityId: l.id,
              agentKey: "listing_optimization",
              status: "active",
              title: { contains: "Complete listing" },
            },
          });
          if (exists) continue;
          await prisma.managerAiRecommendation.create({
            data: {
              userId: l.ownerId,
              agentKey: "listing_optimization",
              title: "Complete listing fields",
              description: `Missing: ${missing.join(", ")}. Use AI assistant on the listing page to draft copy before publishing.`,
              confidence: 0.72,
              targetEntityType: "short_term_listing",
              targetEntityId: l.id,
              suggestedAction: "draft_listing_copy",
              status: "active",
              payload: { missing } as object,
            },
          });
          created += 1;
        }
        break;
      }
      case "stalled_booking": {
        const stale = new Date(Date.now() - 48 * 3600 * 1000);
        const bookings = await prisma.booking.findMany({
          where: {
            status: { in: ["PENDING", "AWAITING_HOST_APPROVAL"] },
            updatedAt: { lt: stale },
          },
          take: 30,
          select: { id: true, guestId: true, listing: { select: { ownerId: true, title: true } } },
        });
        for (const b of bookings) {
          const exists = await prisma.managerAiRecommendation.findFirst({
            where: {
              targetEntityType: "booking",
              targetEntityId: b.id,
              agentKey: "booking_ops",
              status: "active",
            },
          });
          if (exists) continue;
          await prisma.managerAiRecommendation.create({
            data: {
              userId: b.listing.ownerId,
              agentKey: "booking_ops",
              title: "Booking may need a nudge",
              description: `Reservation for “${b.listing.title.slice(0, 60)}” has been pending — review payment or approval state.`,
              confidence: 0.6,
              targetEntityType: "booking",
              targetEntityId: b.id,
              suggestedAction: "review_booking_state",
              status: "active",
            },
          });
          created += 1;
        }
        break;
      }
      case "pricing_opportunity": {
        const listings = await prisma.shortTermListing.findMany({
          where: { listingStatus: "PUBLISHED", bnhubListingCompletedStays: 0 },
          take: 20,
          select: { id: true, ownerId: true, title: true },
        });
        for (const l of listings) {
          const exists = await prisma.managerAiRecommendation.findFirst({
            where: {
              userId: l.ownerId,
              targetEntityId: l.id,
              agentKey: "revenue",
              title: { contains: "Promotion" },
              createdAt: { gt: new Date(Date.now() - 7 * 864e5) },
            },
          });
          if (exists) continue;
          await prisma.managerAiRecommendation.create({
            data: {
              userId: l.ownerId,
              agentKey: "revenue",
              title: "Consider a limited promotion",
              description:
                "Listing is published with no completed stays yet — review pricing or a short promotional window (human approval before any live price change).",
              confidence: 0.5,
              targetEntityType: "short_term_listing",
              targetEntityId: l.id,
              suggestedAction: "recommend_promotion",
              status: "active",
            },
          });
          created += 1;
        }
        break;
      }
      case "host_payout_readiness": {
        const hosts = await prisma.user.findMany({
          where: {
            role: "HOST",
            OR: [{ stripeOnboardingComplete: false }, { stripeAccountId: null }],
            shortTermListings: { some: { listingStatus: "PUBLISHED" } },
          },
          take: 40,
          select: { id: true },
        });
        for (const h of hosts) {
          const exists = await prisma.managerAiRecommendation.findFirst({
            where: {
              userId: h.id,
              agentKey: "host_management",
              title: { contains: "Stripe" },
              createdAt: { gt: new Date(Date.now() - 14 * 864e5) },
            },
          });
          if (exists) continue;
          await prisma.managerAiRecommendation.create({
            data: {
              userId: h.id,
              agentKey: "host_management",
              title: "Finish Stripe Connect for payouts",
              description: "Published listing detected — complete Stripe onboarding to receive payouts when bookings pay out.",
              confidence: 0.85,
              targetEntityType: "user",
              targetEntityId: h.id,
              suggestedAction: "stripe_onboarding",
              status: "active",
            },
          });
          created += 1;
        }
        break;
      }
      case "trust_review_signal": {
        const disputes = await prisma.dispute.findMany({
          where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "ESCALATED"] } },
          take: 20,
          select: { id: true, bookingId: true },
        });
        for (const d of disputes) {
          const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            take: 1,
            select: { id: true },
          });
          const adminId = admins[0]?.id;
          if (!adminId) break;
          const exists = await prisma.managerAiRecommendation.findFirst({
            where: {
              userId: adminId,
              targetEntityType: "dispute",
              targetEntityId: d.id,
              agentKey: "trust_safety",
            },
          });
          if (exists) continue;
          await prisma.managerAiRecommendation.create({
            data: {
              userId: adminId,
              agentKey: "trust_safety",
              title: "Dispute needs trust review",
              description: `Dispute ${d.id.slice(0, 8)}… linked to booking — review evidence and policy.`,
              confidence: 0.75,
              targetEntityType: "dispute",
              targetEntityId: d.id,
              suggestedAction: "admin_review",
              status: "active",
              payload: { bookingId: d.bookingId } as object,
            },
          });
          created += 1;
        }
        break;
      }
      case "admin_daily_summary": {
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, take: 1, select: { id: true } });
        const a = admins[0];
        if (a) {
          const dup = await prisma.managerAiRecommendation.findFirst({
            where: {
              userId: a.id,
              agentKey: "admin_insights",
              targetEntityType: "platform",
              targetEntityId: "daily",
              createdAt: { gte: start },
            },
          });
          if (!dup) {
            await prisma.managerAiRecommendation.create({
              data: {
                userId: a.id,
                agentKey: "admin_insights",
                title: "Daily operations pulse",
                description:
                  "Open the AI dashboard → Insights for live counts. This card is a reminder only — figures are never invented here.",
                confidence: 0.99,
                targetEntityType: "platform",
                targetEntityId: "daily",
                suggestedAction: "open_insights",
                status: "active",
              },
            });
            created += 1;
          }
        }
        break;
      }
      case "guest_abandoned_journey": {
        const staleGuest = new Date(Date.now() - 48 * 3600 * 1000);
        const pendingGuest = await prisma.booking.findMany({
          where: { status: "PENDING", updatedAt: { lt: staleGuest } },
          take: 25,
          select: { id: true, guestId: true, listing: { select: { title: true } } },
        });
        for (const b of pendingGuest) {
          const exists = await prisma.managerAiRecommendation.findFirst({
            where: {
              userId: b.guestId,
              targetEntityType: "booking",
              targetEntityId: b.id,
              agentKey: "guest_support",
              status: "active",
            },
          });
          if (exists) continue;
          await prisma.managerAiRecommendation.create({
            data: {
              userId: b.guestId,
              agentKey: "guest_support",
              title: "Complete your reservation",
              description: `Your stay “${b.listing.title.slice(0, 50)}” is still awaiting payment. Open the booking to continue or cancel.`,
              confidence: 0.65,
              targetEntityType: "booking",
              targetEntityId: b.id,
              suggestedAction: "resume_checkout",
              status: "active",
            },
          });
          created += 1;
        }
        break;
      }
      case "re_engagement_host_drafts": {
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const staleDrafts = await prisma.shortTermListing.findMany({
          where: { listingStatus: "DRAFT", updatedAt: { lt: weekAgo } },
          take: 25,
          select: { id: true, ownerId: true, title: true },
        });
        for (const l of staleDrafts) {
          const exists = await prisma.managerAiRecommendation.findFirst({
            where: {
              userId: l.ownerId,
              targetEntityId: l.id,
              agentKey: "host_management",
              title: { contains: "draft" },
              createdAt: { gt: new Date(Date.now() - 14 * 86400000) },
            },
          });
          if (exists) continue;
          await prisma.managerAiRecommendation.create({
            data: {
              userId: l.ownerId,
              agentKey: "host_management",
              title: "Resume your listing draft",
              description:
                "This draft has not been updated in over a week — finish details or publish when you are ready.",
              confidence: 0.55,
              targetEntityType: "short_term_listing",
              targetEntityId: l.id,
              suggestedAction: "open_listing_editor",
              status: "active",
            },
          });
          created += 1;
        }
        break;
      }
      case "review_gap_signal": {
        const cool = new Date(Date.now() - 3 * 86400000);
        const done = await prisma.booking.findMany({
          where: { status: "COMPLETED", checkOut: { lt: cool } },
          take: 25,
          select: { id: true, listing: { select: { id: true, ownerId: true, title: true } } },
        });
        for (const b of done) {
          const rev = await prisma.review.findUnique({ where: { bookingId: b.id }, select: { id: true } });
          if (rev) continue;
          const exists = await prisma.managerAiRecommendation.findFirst({
            where: {
              userId: b.listing.ownerId,
              targetEntityType: "booking",
              targetEntityId: b.id,
              agentKey: "listing_optimization",
              title: { contains: "review" },
            },
          });
          if (exists) continue;
          await prisma.managerAiRecommendation.create({
            data: {
              userId: b.listing.ownerId,
              agentKey: "listing_optimization",
              title: "Guest review may be pending",
              description: `Completed stay for “${b.listing.title.slice(0, 50)}” has no guest review in our records yet — use your standard review-request flow (no auto outbound message from this rule).`,
              confidence: 0.5,
              targetEntityType: "booking",
              targetEntityId: b.id,
              suggestedAction: "review_request_policy",
              status: "active",
              payload: { listingId: b.listing.id } as object,
            },
          });
          created += 1;
        }
        break;
      }
      default:
        break;
    }

    await prisma.managerAiAutomationRule.updateMany({
      where: { key: ruleKey },
      data: { lastRunAt: new Date(), nextRunAt: null },
    });

    await logManagerAgentRun({
      agentKey: "admin_insights",
      decisionMode: "AUTO_EXECUTE_SAFE",
      inputSummary: `automation:${ruleKey}`,
      outputSummary: `created_recommendations:${created}`,
      status: "completed",
      result: { ruleKey, created },
    });

    return { ruleKey, ok: true, createdRecommendations: created };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "automation_failed";
    await logManagerAgentRun({
      agentKey: "admin_insights",
      decisionMode: "ASSIST_ONLY",
      inputSummary: `automation:${ruleKey}`,
      outputSummary: msg,
      status: "failed",
      error: { message: msg },
    });
    return { ruleKey, ok: false, createdRecommendations: created, error: msg };
  }
}

/** Idempotent: upserts all known automation rules (adds new keys to existing deployments). */
export async function syncAutomationRuleDefinitions() {
  for (const r of AUTOMATION_RULE_DEFINITIONS) {
    await ensureRuleRow(r.key, r.name, r.description, r.frequency);
  }
}
