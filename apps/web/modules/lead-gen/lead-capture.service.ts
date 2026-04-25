/**
 * Persists growth-tagged leads into existing `Lead` table (real rows, idempotent window optional).
 */
import { prisma } from "@/lib/db";
import { scoreLeadSource } from "./lead-source-scoring.service";

export type CaptureGrowthLeadInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
  /** buyer | seller | broker | host | investor | renter */
  intentCategory: string;
  source?: string | null;
  campaign?: string | null;
  medium?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  referrerUrl?: string | null;
  leadSource?: string | null;
  fsboListingId?: string | null;
  shortTermListingId?: string | null;
  userId?: string | null;
  introducedByBrokerId?: string | null;
  /** Acquisition tag, e.g. `broker_interest` (see `Lead.growthTag`). */
  growthTag?: string | null;
};

export async function captureGrowthLead(input: CaptureGrowthLeadInput) {
  const emailKey = input.email.trim().toLowerCase();
  const recent = await prisma.lead.findFirst({
    where: {
      email: emailKey,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return { id: recent.id, duplicate: true as const };
  }

  const score = scoreLeadSource({
    source: input.source,
    medium: input.medium,
    campaign: input.campaign,
    leadSource: input.leadSource ?? `growth:${input.intentCategory}`,
  });

  const row = await prisma.lead.create({
    data: {
      name: input.name.trim().slice(0, 200),
      email: emailKey.slice(0, 200),
      phone: input.phone.trim().slice(0, 40),
      message: input.message.trim().slice(0, 8000),
      status: "new",
      score,
      source: input.source ?? "growth_machine",
      campaign: input.campaign ?? null,
      medium: input.medium ?? null,
      utmTerm: input.utmTerm ?? null,
      utmContent: input.utmContent ?? null,
      referrerUrl: input.referrerUrl ?? null,
      leadSource: input.leadSource ?? "form",
      leadType: input.intentCategory,
      fsboListingId: input.fsboListingId ?? null,
      shortTermListingId: input.shortTermListingId ?? null,
      userId: input.userId ?? null,
      introducedByBrokerId: input.introducedByBrokerId ?? null,
      growthTag: input.growthTag?.trim() ? input.growthTag.trim().slice(0, 64) : null,
      pipelineStatus: "new",
      pipelineStage: "new",
    },
  });

  const marketingUserId = input.userId;
  if (marketingUserId) {
    void import("@/modules/marketing-intelligence/activation.service")
      .then((m) =>
        m.emitLeadCaptureMarketing({
          userId: marketingUserId,
          source: input.source ?? input.leadSource,
          campaignId: input.campaign ?? undefined,
          leadId: row.id,
        })
      )
      .catch(() => {});
  }

  return { id: row.id, duplicate: false as const };
}

/**
 * Public acquisition landings — persists `Lead` with attribution; optional email if phone present.
 * Synthetic email only when phone is provided (schema requires email string).
 */
export async function capturePublicLandingLead(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  intentCategory: string;
  source?: string | null;
  campaign?: string | null;
  medium?: string | null;
  referrerUrl?: string | null;
}) {
  const name = input.name.trim().slice(0, 200);
  const emailRaw = input.email?.trim() ?? "";
  const phoneRaw = input.phone?.trim() ?? "";
  if (!emailRaw && !phoneRaw) {
    return { error: "Provide email or phone" as const };
  }
  const email =
    emailRaw ||
    `pending-${phoneRaw.replace(/\D/g, "").slice(-8) || "contact"}-${Date.now().toString(36)}@landing.lecipm.local`;
  const phone = phoneRaw || "—";
  const message = (input.message?.trim() || "Lead from LECIPM ads landing").slice(0, 8000);

  return captureGrowthLead({
    name,
    email,
    phone: phone.slice(0, 40),
    message,
    intentCategory: input.intentCategory,
    source: input.source ?? "paid_landing",
    campaign: input.campaign ?? null,
    medium: input.medium ?? null,
    referrerUrl: input.referrerUrl ?? null,
    leadSource: "ads_landing_public",
    userId: null,
    introducedByBrokerId: null,
  });
}
