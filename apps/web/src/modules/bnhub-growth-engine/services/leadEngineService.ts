import type { BnhubLeadSourceType, Prisma } from "@prisma/client";
import {
  BnhubLeadStatus,
  BnhubLeadTemperature,
  BnhubLeadType,
  BnhubLeadEventSource,
  BnhubLeadEventType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { appendGrowthAuditLog } from "./growthAuditService";

export type NormalizedLeadInput = {
  sourceType: BnhubLeadSourceType;
  sourceConnectorCode?: string | null;
  externalLeadRef?: string | null;
  listingId?: string | null;
  campaignId?: string | null;
  distributionId?: string | null;
  hostUserId?: string | null;
  leadType?: BnhubLeadType;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  preferredLanguage?: string | null;
  message?: string | null;
  travelDatesJson?: Prisma.InputJsonValue;
  budgetMinCents?: number | null;
  budgetMaxCents?: number | null;
  guestCount?: number | null;
};

const DISPOSABLE_EMAIL = /@(mailinator|tempmail|guerrillamail|yopmail|10minutemail|trashmail)\./i;

export function computeSpamSignals(input: NormalizedLeadInput): { spamScore: number; reasons: string[] } {
  let spamScore = 0;
  const reasons: string[] = [];
  const msg = input.message ?? "";
  const email = input.email?.toLowerCase().trim() ?? "";

  if (email && DISPOSABLE_EMAIL.test(email)) {
    spamScore += 40;
    reasons.push("disposable_email_domain");
  }
  if (msg && /https?:\/\//i.test(msg) && msg.length < 100) {
    spamScore += 25;
    reasons.push("short_message_with_url");
  }
  if (msg && msg === msg.toUpperCase() && msg.length > 20) {
    spamScore += 15;
    reasons.push("all_caps_message");
  }
  if (!input.email?.trim() && !input.phone?.trim() && msg.length > 0 && msg.length < 8) {
    spamScore += 20;
    reasons.push("minimal_contact");
  }
  if (/(.)\1{10,}/.test(msg)) {
    spamScore += 35;
    reasons.push("repeated_chars");
  }
  if (input.fullName && /\b(viagra|cialis|crypto|forex)\b/i.test(`${input.fullName} ${msg}`)) {
    spamScore += 50;
    reasons.push("spam_keywords");
  }
  return { spamScore: Math.min(100, spamScore), reasons };
}

export function buildDedupeKey(input: NormalizedLeadInput): string | null {
  const parts: string[] = [];
  if (input.listingId) parts.push(`l:${input.listingId}`);
  if (input.campaignId) parts.push(`c:${input.campaignId}`);
  const em = input.email?.toLowerCase().trim();
  if (em) parts.push(`e:${em}`);
  const ph = input.phone?.replace(/\D/g, "") ?? "";
  if (ph.length >= 8) parts.push(`p:${ph.slice(-10)}`);
  if (input.externalLeadRef) parts.push(`x:${input.externalLeadRef}`);
  return parts.length >= 2 ? parts.sort().join("|") : null;
}

function responseSlaDueAt(temperature: BnhubLeadTemperature): Date {
  const now = Date.now();
  if (temperature === BnhubLeadTemperature.HOT) return new Date(now + 15 * 60_000);
  if (temperature === BnhubLeadTemperature.WARM) return new Date(now + 4 * 3600_000);
  return new Date(now + 24 * 3600_000);
}

export function scoreLead(
  input: NormalizedLeadInput,
  spamPenaltyFromSignals: number = 0
): { score: number; temperature: BnhubLeadTemperature } {
  let score = 18;
  if (input.email?.trim()) score += 16;
  if (input.phone?.trim()) score += 14;
  if (input.fullName && input.fullName.trim().length > 3) score += 6;
  if (input.message && input.message.length > 40) score += 16;
  if (input.message && input.message.length > 120) score += 6;
  if (input.travelDatesJson) score += 10;
  if (input.budgetMinCents && input.budgetMaxCents && input.budgetMaxCents >= input.budgetMinCents) score += 10;
  if (input.guestCount && input.guestCount > 0) score += 5;
  if (input.sourceType === "INTERNAL_FORM") score += 6;
  if (["META_LEAD", "GOOGLE_LEAD", "TIKTOK_LEAD"].includes(input.sourceType)) score += 8;
  score = Math.min(100, Math.max(0, score - spamPenaltyFromSignals));
  const temperature =
    score >= 72 ? BnhubLeadTemperature.HOT : score >= 42 ? BnhubLeadTemperature.WARM : BnhubLeadTemperature.COLD;
  return { score, temperature };
}

export async function deduplicateLead(input: NormalizedLeadInput): Promise<string | null> {
  const since90d = new Date(Date.now() - 90 * 86400000);
  const since30d = new Date(Date.now() - 30 * 86400000);
  const since48h = new Date(Date.now() - 48 * 3600000);

  if (input.externalLeadRef?.trim() && input.campaignId) {
    const hit = await prisma.bnhubLead.findFirst({
      where: {
        externalLeadRef: input.externalLeadRef,
        campaignId: input.campaignId,
        createdAt: { gte: since90d },
      },
      select: { id: true },
    });
    if (hit) return hit.id;
  }

  const dedupeKey = buildDedupeKey(input);
  if (dedupeKey) {
    const hit = await prisma.bnhubLead.findFirst({
      where: { dedupeKey, createdAt: { gte: since30d } },
      select: { id: true },
    });
    if (hit) return hit.id;
  }

  if (!input.email && !input.phone) return null;
  const or: Prisma.BnhubLeadWhereInput[] = [];
  if (input.email?.trim()) or.push({ email: input.email.trim() });
  const phRaw = input.phone?.trim();
  if (phRaw) or.push({ phone: phRaw });
  if (or.length === 0) return null;

  const existing = await prisma.bnhubLead.findFirst({
    where: {
      OR: or,
      createdAt: { gte: since48h },
      ...(input.listingId ? { listingId: input.listingId } : {}),
    },
    select: { id: true },
  });
  return existing?.id ?? null;
}

export async function ingestLeadFromConnector(
  input: NormalizedLeadInput,
  opts?: { actorId?: string | null; skipDedup?: boolean }
) {
  if (!opts?.skipDedup) {
    const dup = await deduplicateLead(input);
    if (dup) {
      await createLeadTimelineEvent(dup, "SYNCED", "CONNECTOR", { dedup: true });
      return prisma.bnhubLead.findUniqueOrThrow({ where: { id: dup } });
    }
  }

  const spam = computeSpamSignals(input);
  const { score, temperature } = scoreLead(input, Math.min(45, spam.spamScore));
  const dedupeKey = buildDedupeKey(input);
  const likelySpam = spam.spamScore >= 82;
  const status = likelySpam ? BnhubLeadStatus.SPAM : BnhubLeadStatus.NEW;
  const responseDueAt = likelySpam ? null : responseSlaDueAt(temperature);

  const lead = await prisma.bnhubLead.create({
    data: {
      sourceType: input.sourceType,
      sourceConnectorCode: input.sourceConnectorCode,
      externalLeadRef: input.externalLeadRef,
      listingId: input.listingId,
      campaignId: input.campaignId,
      distributionId: input.distributionId,
      hostUserId: input.hostUserId,
      leadType: input.leadType ?? BnhubLeadType.SHORT_TERM_INQUIRY,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      country: input.country,
      city: input.city,
      preferredLanguage: input.preferredLanguage,
      message: input.message,
      travelDatesJson: input.travelDatesJson,
      budgetMinCents: input.budgetMinCents,
      budgetMaxCents: input.budgetMaxCents,
      guestCount: input.guestCount,
      leadScore: score,
      leadTemperature: likelySpam ? BnhubLeadTemperature.COLD : temperature,
      status,
      spamScore: spam.spamScore,
      spamReasonsJson: spam.reasons.length ? spam.reasons : undefined,
      dedupeKey: dedupeKey ?? undefined,
      responseDueAt,
    },
  });

  await createLeadTimelineEvent(lead.id, "CREATED", "CONNECTOR", { source: input.sourceType });
  await createLeadTimelineEvent(lead.id, "SCORED", "SYSTEM", { score, temperature, spam: spam.spamScore });
  if (likelySpam) {
    await createLeadTimelineEvent(lead.id, "SPAM_FLAGGED", "SYSTEM", { reasons: spam.reasons });
  }
  await appendGrowthAuditLog({
    actorType: "CONNECTOR_WEBHOOK",
    actorId: opts?.actorId,
    entityType: "bnhub_lead",
    entityId: lead.id,
    actionType: "lead_ingested",
    actionSummary: likelySpam ? `Lead flagged spam (score ${spam.spamScore})` : `Lead from ${input.sourceType}`,
  });

  return lead;
}

export function normalizeLeadPayload(raw: Record<string, unknown>): NormalizedLeadInput {
  return {
    sourceType: "IMPORT",
    fullName: typeof raw.fullName === "string" ? raw.fullName : null,
    email: typeof raw.email === "string" ? raw.email : null,
    phone: typeof raw.phone === "string" ? raw.phone : null,
    message: typeof raw.message === "string" ? raw.message : null,
    city: typeof raw.city === "string" ? raw.city : null,
    country: typeof raw.country === "string" ? raw.country : null,
    guestCount: typeof raw.guestCount === "number" ? raw.guestCount : null,
  };
}

export async function assignLeadOwner(leadId: string, ownerUserId: string | null) {
  return prisma.bnhubLead.update({
    where: { id: leadId },
    data: { ownerUserId },
  });
}

export async function createLeadTimelineEvent(
  leadId: string,
  type: BnhubLeadEventType,
  source: BnhubLeadEventSource,
  data?: Record<string, unknown>
) {
  return prisma.bnhubLeadEvent.create({
    data: {
      leadId,
      eventType: type,
      eventSource: source,
      eventDataJson: data === undefined ? undefined : (data as Prisma.InputJsonValue),
    },
  });
}

export async function markLeadQualified(leadId: string) {
  const cur = await prisma.bnhubLead.findUnique({
    where: { id: leadId },
    select: { firstResponseAt: true },
  });
  await prisma.bnhubLead.update({
    where: { id: leadId },
    data: {
      status: BnhubLeadStatus.QUALIFIED,
      ...(cur?.firstResponseAt == null ? { firstResponseAt: new Date() } : {}),
    },
  });
  await createLeadTimelineEvent(leadId, "QUALIFIED", "ADMIN", {});
}

export async function markLeadConverted(leadId: string) {
  await prisma.bnhubLead.update({
    where: { id: leadId },
    data: { status: BnhubLeadStatus.CONVERTED, convertedAt: new Date() },
  });
  await createLeadTimelineEvent(leadId, "CONVERTED", "ADMIN", {});
}

export async function markLeadLost(leadId: string) {
  await prisma.bnhubLead.update({
    where: { id: leadId },
    data: { status: BnhubLeadStatus.LOST },
  });
  await createLeadTimelineEvent(leadId, "CLOSED", "ADMIN", { reason: "lost" });
}

export async function markLeadSpam(leadId: string, reasons?: string[]) {
  await prisma.bnhubLead.update({
    where: { id: leadId },
    data: {
      status: BnhubLeadStatus.SPAM,
      leadTemperature: BnhubLeadTemperature.COLD,
      spamScore: 100,
      spamReasonsJson: reasons ?? ["manual_mark_spam"],
    },
  });
  await createLeadTimelineEvent(leadId, "SPAM_FLAGGED", "ADMIN", { reasons });
}

function leadRowToNormalized(lead: {
  sourceType: BnhubLeadSourceType;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  message: string | null;
  travelDatesJson: unknown;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  guestCount: number | null;
}): NormalizedLeadInput {
  return {
    sourceType: lead.sourceType,
    email: lead.email,
    phone: lead.phone,
    fullName: lead.fullName,
    message: lead.message,
    travelDatesJson: lead.travelDatesJson as Prisma.InputJsonValue | undefined,
    budgetMinCents: lead.budgetMinCents,
    budgetMaxCents: lead.budgetMaxCents,
    guestCount: lead.guestCount,
  };
}

/** Batch re-score (idempotent updates). For Edge/cron batch jobs. */
export async function scoreLeadsBatch(limit = 40): Promise<{ updated: number }> {
  const rows = await prisma.bnhubLead.findMany({
    where: { status: { not: "SPAM" } },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });
  let updated = 0;
  for (const lead of rows) {
    const input = leadRowToNormalized(lead);
    const spam = computeSpamSignals(input);
    const { score, temperature } = scoreLead(input, Math.min(45, spam.spamScore));
    const unchanged =
      lead.leadScore === score &&
      lead.leadTemperature === temperature &&
      lead.spamScore === spam.spamScore;
    if (unchanged) continue;
    await prisma.bnhubLead.update({
      where: { id: lead.id },
      data: {
        leadScore: score,
        leadTemperature: temperature,
        spamScore: spam.spamScore,
        spamReasonsJson: spam.reasons.length ? spam.reasons : undefined,
      },
    });
    await createLeadTimelineEvent(lead.id, "SCORED", "SYSTEM", { score, temperature, batch: true });
    updated++;
  }
  return { updated };
}

export async function listLeadsByCampaign(campaignId: string) {
  return prisma.bnhubLead.findMany({ where: { campaignId }, orderBy: { createdAt: "desc" } });
}

export async function listLeadsByListing(listingId: string) {
  return prisma.bnhubLead.findMany({ where: { listingId }, orderBy: { createdAt: "desc" } });
}

export async function listLeadsForHost(hostUserId: string) {
  return prisma.bnhubLead.findMany({
    where: {
      OR: [{ hostUserId }, { listing: { ownerId: hostUserId } }],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getLeadConversionStats(hostUserId?: string) {
  const scope: Prisma.BnhubLeadWhereInput = hostUserId
    ? { OR: [{ hostUserId }, { listing: { ownerId: hostUserId } }] }
    : {};
  const [total, converted, hot] = await Promise.all([
    prisma.bnhubLead.count({ where: scope }),
    prisma.bnhubLead.count({ where: { ...scope, status: "CONVERTED" } }),
    prisma.bnhubLead.count({
      where: {
        ...scope,
        leadTemperature: "HOT",
        status: { not: "SPAM" },
      },
    }),
  ]);
  return { total, converted, hot, rate: total > 0 ? converted / total : 0 };
}
