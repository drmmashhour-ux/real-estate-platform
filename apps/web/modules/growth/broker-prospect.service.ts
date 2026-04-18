/**
 * CRM-lite for operator acquisition of first paying brokers.
 * Does not touch core `Lead` creation or Stripe — optional sync reads `PlatformPayment` only.
 */

import type { Prisma } from "@prisma/client";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildLeadPreview } from "@/modules/growth/lead-preview.service";

export const BROKER_PROSPECT_STATUSES = [
  "new",
  "contacted",
  "replied",
  "demo_scheduled",
  "converted",
  "lost",
] as const;

export type BrokerProspectStatus = (typeof BROKER_PROSPECT_STATUSES)[number];

export type BrokerProspectSource = "manual" | "instagram" | "referral";

export type CreateBrokerProspectInput = {
  name: string;
  agency?: string | null;
  phone?: string | null;
  email: string;
  source?: BrokerProspectSource;
  notes?: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createProspect(input: CreateBrokerProspectInput) {
  const email = normalizeEmail(input.email);
  return prisma.brokerProspect.create({
    data: {
      name: input.name.trim(),
      agency: input.agency?.trim() || null,
      phone: (input.phone ?? "").trim(),
      email,
      source: input.source ?? "manual",
      notes: input.notes?.trim() || null,
    },
  });
}

export async function updateStatus(id: string, status: BrokerProspectStatus) {
  return prisma.brokerProspect.update({
    where: { id },
    data: { status },
  });
}

export async function listProspects(): Promise<
  Awaited<ReturnType<typeof prisma.brokerProspect.findMany>>
> {
  return prisma.brokerProspect.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function addNote(id: string, line: string) {
  const prev = await prisma.brokerProspect.findUnique({
    where: { id },
    select: { notes: true },
  });
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const next = [prev?.notes?.trim() || "", `[${stamp}] ${line.trim()}`].filter(Boolean).join("\n");
  return prisma.brokerProspect.update({
    where: { id },
    data: { notes: next },
  });
}

/** Logged when operator uses close tools (copy script / show lead demo). */
export type BrokerCloseMessageType = "follow_up" | "close" | "demo" | "objection";

export async function updateProspect(
  id: string,
  data: {
    name?: string;
    agency?: string | null;
    phone?: string;
    email?: string;
    source?: string;
    status?: BrokerProspectStatus;
    notes?: string | null;
    linkedBrokerUserId?: string | null;
    demoLeadUsedAt?: Date | null;
    lastCloseMessageType?: BrokerCloseMessageType | null;
    /** When true with lastCloseMessageType, sets lastCloseContactAt to now */
    touchCloseContact?: boolean;
  },
) {
  const patch: Prisma.BrokerProspectUpdateInput = {};
  if (data.name != null) patch.name = data.name.trim();
  if (data.agency !== undefined) patch.agency = data.agency?.trim() || null;
  if (data.phone != null) patch.phone = data.phone.trim();
  if (data.email != null) patch.email = normalizeEmail(data.email);
  if (data.source != null) patch.source = data.source;
  if (data.status != null) patch.status = data.status;
  if (data.notes !== undefined) patch.notes = data.notes;
  if (data.linkedBrokerUserId !== undefined) patch.linkedBrokerUserId = data.linkedBrokerUserId;
  if (data.demoLeadUsedAt !== undefined) patch.demoLeadUsedAt = data.demoLeadUsedAt;
  if (data.lastCloseMessageType !== undefined) patch.lastCloseMessageType = data.lastCloseMessageType;
  if (data.touchCloseContact && data.lastCloseMessageType != null) {
    patch.lastCloseContactAt = new Date();
  }
  if (Object.keys(patch).length === 0) {
    return prisma.brokerProspect.findUniqueOrThrow({ where: { id } });
  }
  return prisma.brokerProspect.update({
    where: { id },
    data: patch,
  });
}

async function resolveBrokerUserIdForProspect(p: {
  id: string;
  email: string;
  linkedBrokerUserId: string | null;
}): Promise<string | null> {
  if (p.linkedBrokerUserId) return p.linkedBrokerUserId;
  const u = await prisma.user.findFirst({
    where: {
      email: { equals: p.email, mode: "insensitive" },
      role: PlatformRole.BROKER,
    },
    select: { id: true },
  });
  return u?.id ?? null;
}

/**
 * Reads paid `lead_unlock` platform payments and updates prospects (by email → broker user).
 * Safe to run repeatedly; does not modify Stripe.
 */
export async function syncProspectConversionsFromLeadUnlockPayments(): Promise<{
  updated: number;
  prospectsChecked: number;
}> {
  const prospects = await prisma.brokerProspect.findMany();
  let updated = 0;

  for (const p of prospects) {
    const userId = await resolveBrokerUserIdForProspect(p);
    if (!userId) continue;

    const payments = await prisma.platformPayment.findMany({
      where: {
        userId,
        paymentType: "lead_unlock",
        status: "paid",
      },
      select: { amountCents: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const total = payments.reduce((s, x) => s + (x.amountCents ?? 0), 0);
    if (total <= 0) continue;

    const firstAt = payments[0]?.createdAt ?? null;

    await prisma.brokerProspect.update({
      where: { id: p.id },
      data: {
        linkedBrokerUserId: userId,
        firstPurchaseAt: p.firstPurchaseAt ?? firstAt,
        totalSpentCents: total,
        status: "converted",
      },
    });
    updated++;
  }

  return { updated, prospectsChecked: prospects.length };
}

export type SampleLeadPreview = {
  location: string;
  intent: string;
  budget: string | null;
  shortMessage: string;
};

/**
 * One masked real lead for sales conversations — PII stripped.
 */
export async function getMaskedSampleLeadPreview(): Promise<SampleLeadPreview | null> {
  const lead = await prisma.lead.findFirst({
    where: {
      message: { not: "" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      message: true,
      dealValue: true,
      estimatedValue: true,
      leadType: true,
      leadSource: true,
      aiExplanation: true,
    },
  });
  if (!lead) return null;

  const preview = buildLeadPreview(lead);
  const budget =
    lead.dealValue != null && lead.dealValue > 0
      ? `$${lead.dealValue.toLocaleString("en-CA")} CAD (est.)`
      : lead.estimatedValue != null && lead.estimatedValue > 0
        ? `$${lead.estimatedValue.toLocaleString("en-CA")} CAD (est.)`
        : null;

  return {
    location: preview.location,
    intent: preview.intent,
    budget,
    shortMessage: preview.shortMessage,
  };
}
