/**
 * Lead monetization V1 — additive access + checkout initiation (reuses Stripe checkout helpers).
 * Does not modify Stripe core; does not change early-leads ingestion.
 */

import { PlatformRole } from "@prisma/client";
import { engineFlags, leadMonetizationFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { computeLeadValueAndPrice } from "@/modules/revenue/lead-pricing.service";
import { getRevenueControlSettings } from "@/modules/revenue/revenue-control-settings";
import { canAccessRevenueFeature } from "@/modules/revenue/revenue-guard.service";
import { trackRevenueEvent } from "@/modules/revenue/revenue-events.service";
import {
  isRevenueDashboardV1Enabled,
  isRevenueEnforcementV1Enabled,
} from "@/modules/revenue/revenue-enforcement-flags";
import { recordUnlockAttempt } from "@/modules/revenue/revenue-monitoring.service";
import { recordBrokerConversionAttempt } from "@/modules/brokers/broker-monitoring.service";
import type { LeadPricingInput, LeadPricingResult } from "@/modules/revenue/lead-pricing.service";
import type { LeadMonetizationState, LeadUnlockResult } from "./lead-monetization.types";
import { recordLeadUnlockAttempt as recordMonetizationUnlockAttempt } from "./lead-monetization-monitoring.service";
import {
  applyFirstLeadPricing,
  isFirstLeadPurchaseEligible,
} from "@/modules/brokers/broker-conversion.service";

export function isLeadMonetizationV1Enabled(): boolean {
  return leadMonetizationFlags.leadMonetizationV1;
}

/** Mask display name until unlock — avoids full PII in previews. */
export function maskLeadDisplayName(name: string): string {
  const t = name.trim();
  if (!t) return "Prospect";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return `${parts[0]!.charAt(0)}.`;
  return `${parts[0]!.charAt(0)}. ${parts[parts.length - 1]}`;
}

/** Strip obvious email/phone patterns and cap length for locked previews. */
export function redactLeadMessagePreview(message: string | null | undefined, maxLen = 120): string {
  if (!message?.trim()) return "";
  let s = message
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[redacted]")
    .replace(/\b\+?\d[\d\s().-]{7,}\d\b/g, "[redacted]");
  if (s.length > maxLen) return `${s.slice(0, maxLen)}…`;
  return s;
}

/**
 * Deterministic unlock price from lead signals + revenue control bounds (V1 — no ML pricing).
 */
export function computeLeadUnlockPrice(
  lead: LeadPricingInput,
  opts: {
    basePriceCents?: number | null;
    minCents?: number;
    maxCents?: number;
    defaultLeadPriceCents?: number;
  },
): LeadPricingResult {
  return computeLeadValueAndPrice(lead, {
    basePriceCents: opts.basePriceCents ?? undefined,
    minCents: opts.minCents,
    maxCents: opts.maxCents,
    defaultLeadPriceCents: opts.defaultLeadPriceCents,
  });
}

export { inferLeadIntentLabel } from "./lead-monetization-shared";

function brokerScopedForLead(
  role: PlatformRole,
  brokerId: string,
  lead: { introducedByBrokerId: string | null; lastFollowUpByBrokerId: string | null },
): boolean {
  return (
    role === PlatformRole.ADMIN ||
    lead.introducedByBrokerId === brokerId ||
    lead.lastFollowUpByBrokerId === brokerId
  );
}

export async function getLeadAccessState(leadId: string, brokerId: string): Promise<LeadMonetizationState | null> {
  const user = await prisma.user.findUnique({
    where: { id: brokerId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) return null;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      _count: { select: { crmInteractions: true, leadTimelineEvents: true } },
    },
  });
  if (!lead || !brokerScopedForLead(user.role, brokerId, lead)) return null;

  const settings = await getRevenueControlSettings();
  const priced = computeLeadValueAndPrice(
    {
      message: lead.message,
      leadSource: lead.leadSource,
      leadType: lead.leadType,
      score: lead.score,
      engagementScore: lead.engagementScore,
      interactionCount: lead._count.crmInteractions + lead._count.leadTimelineEvents,
      hasCompleteContact: Boolean(lead.email?.trim() && lead.phone?.trim()),
    },
    {
      basePriceCents: lead.dynamicLeadPriceCents ?? undefined,
      minCents: settings.leadUnlockMinCents,
      maxCents: settings.leadUnlockMaxCents,
      defaultLeadPriceCents: settings.leadDefaultPriceCents,
    },
  );

  const unlocked = Boolean(lead.contactUnlockedAt);
  const accessLevel: LeadMonetizationState["accessLevel"] = unlocked ? "full" : "preview";

  return {
    leadId: lead.id,
    accessLevel,
    unlocked,
    unlockPrice: priced.leadPrice,
    currency: "CAD",
    viewed: false,
    unlockedAt: lead.contactUnlockedAt?.toISOString(),
  };
}

export async function markLeadUnlocked(leadId: string, brokerId: string): Promise<LeadUnlockResult> {
  const user = await prisma.user.findUnique({
    where: { id: brokerId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return { success: false, leadId, unlocked: false };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      contactUnlockedAt: true,
      introducedByBrokerId: true,
      lastFollowUpByBrokerId: true,
    },
  });
  if (!lead || !brokerScopedForLead(user.role, brokerId, lead)) {
    return { success: false, leadId, unlocked: false };
  }

  if (lead.contactUnlockedAt) {
    return { success: true, leadId, unlocked: true };
  }
  return { success: false, leadId, unlocked: false };
}

export type InitiateLeadUnlockResult =
  | {
      ok: true;
      url: string;
      sessionId: string;
      amountCents: number;
      pricing: ReturnType<typeof computeLeadValueAndPrice>;
    }
  | { ok: false; status: number; error: string; softBlock?: boolean; message?: string; reason?: string };

/**
 * Shared Stripe Checkout creation for CRM lead unlock — used by `/api/leads/[id]/unlock-checkout` and `/api/leads/unlock`.
 */
export async function initiateLeadUnlockCheckout(args: {
  userId: string;
  leadId: string;
  /** When true, increments monetization monitoring unlock attempt counter. */
  recordMonetizationAttempt?: boolean;
}): Promise<InitiateLeadUnlockResult> {
  const { userId, leadId, recordMonetizationAttempt } = args;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return { ok: false, status: 403, error: "Broker access only" };
  }

  if (!isStripeConfigured() || !getStripe()) {
    return { ok: false, status: 503, error: "Payments are not configured" };
  }

  const settings = await getRevenueControlSettings();

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      _count: { select: { crmInteractions: true, leadTimelineEvents: true } },
    },
  });
  if (!lead) return { ok: false, status: 404, error: "Lead not found" };

  if (lead.contactUnlockedAt) {
    return { ok: false, status: 400, error: "Lead contact already unlocked" };
  }

  const brokerScope =
    user?.role === "ADMIN" ||
    lead.introducedByBrokerId === userId ||
    lead.lastFollowUpByBrokerId === userId;
  if (!brokerScope) {
    return { ok: false, status: 403, error: "Not assigned to this lead" };
  }

  if (engineFlags.brokerAcquisitionV1 && user?.role === PlatformRole.BROKER) {
    recordBrokerConversionAttempt({ userId, leadId });
  }

  if (isRevenueEnforcementV1Enabled() || isRevenueDashboardV1Enabled()) {
    recordUnlockAttempt();
  }

  if (recordMonetizationAttempt && leadMonetizationFlags.leadMonetizationV1) {
    recordMonetizationUnlockAttempt();
  }

  const access = await canAccessRevenueFeature({ userId, feature: "lead_unlock" });
  if (!access.allowed) {
    return {
      ok: false,
      status: 200,
      error: "soft_block",
      softBlock: true,
      message:
        "Unlock this lead to continue — add a subscription or use a bypass in staging.",
      reason: access.reason ?? "not_paid",
    };
  }

  const baseCents = lead.dynamicLeadPriceCents ?? undefined;
  const priced = computeLeadValueAndPrice(
    {
      message: lead.message,
      leadSource: lead.leadSource,
      leadType: lead.leadType,
      score: lead.score,
      engagementScore: lead.engagementScore,
      interactionCount: lead._count.crmInteractions + lead._count.leadTimelineEvents,
      hasCompleteContact: Boolean(lead.email?.trim() && lead.phone?.trim()),
    },
    {
      basePriceCents: baseCents,
      minCents: settings.leadUnlockMinCents,
      maxCents: settings.leadUnlockMaxCents,
      defaultLeadPriceCents: settings.leadDefaultPriceCents,
    },
  );

  const base = getPublicAppUrl().replace(/\/$/, "");
  const successUrl = `${base}/dashboard/broker?leadUnlock=success&leadId=${encodeURIComponent(leadId)}`;
  const cancelUrl = `${base}/dashboard/broker?leadUnlock=cancel`;

  try {
    const session = await createCheckoutSession({
      successUrl: successUrl.slice(0, 2040),
      cancelUrl: cancelUrl.slice(0, 2040),
      amountCents: priced.leadPriceCents,
      currency: "cad",
      paymentType: "lead_unlock",
      userId,
      brokerId: userId,
      leadId,
      description: `Unlock lead contact — ${lead.name.slice(0, 40)}`,
      metadata: {
        leadId,
        brokerId: userId,
        leadValue: priced.leadValue,
        leadScore: String(priced.leadScore),
        monetizationType: "lead_unlock",
      },
    });
    if ("error" in session) {
      return { ok: false, status: 502, error: session.error };
    }

    trackRevenueEvent({
      type: "lead_unlocked",
      userId,
      leadId,
      metadata: {
        source: "lead_unlock",
        stage: "checkout_session_created",
        amountCents: finalCents,
        firstLeadOffer: applied.firstLeadOfferApplied,
      },
    });

    return {
      ok: true,
      url: session.url,
      sessionId: session.sessionId,
      amountCents: finalCents,
      pricing: priced,
    };
  } catch {
    return { ok: false, status: 502, error: "Checkout unavailable" };
  }
}
