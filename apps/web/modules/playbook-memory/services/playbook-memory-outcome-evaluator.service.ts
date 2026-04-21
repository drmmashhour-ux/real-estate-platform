import { prisma } from "@/lib/db";
import { playbookLog } from "../playbook-memory.logger";
import * as repo from "../repository/playbook-memory.repository";
import { recordOutcomeUpdate } from "./playbook-memory-write.service";

/**
 * V1: link entity state when present; otherwise mark PARTIAL/NEUTRAL.
 * TODO: domain-specific revenue + conversion from ledgers (deferred).
 */
export async function evaluateMemoryRecordOutcome(memoryRecordId: string): Promise<void> {
  const rec = await repo.findMemoryRecordById(memoryRecordId);
  if (!rec || rec.outcomeStatus !== "PENDING") return;

  if (rec.leadId) {
    await evaluateLeadOutcome(memoryRecordId, rec.leadId);
    return;
  }
  if (rec.dealId) {
    await evaluateDealOutcome(memoryRecordId, rec.dealId);
    return;
  }
  if (rec.bookingId) {
    await evaluateBookingOutcome(memoryRecordId, rec.bookingId);
    return;
  }
  if (rec.listingId) {
    await evaluateListingOutcome(memoryRecordId, rec.listingId);
    return;
  }

  playbookLog.warn("evaluateMemoryRecordOutcome no linked entity", { memoryRecordId });
}

export async function evaluateLeadOutcome(memoryRecordId: string, leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { pipelineStatus: true, status: true },
    });
    if (!lead) {
      await recordOutcomeUpdate({
        memoryRecordId,
        outcomeStatus: "NEUTRAL",
        outcomeSummary: { reason: "lead_missing" },
      });
      return;
    }
    const pipeline = `${lead.pipelineStatus ?? ""}|${lead.status}`;
    const won = pipeline.toLowerCase().includes("won") || pipeline.toLowerCase().includes("closed");
    await recordOutcomeUpdate({
      memoryRecordId,
      outcomeStatus: won ? "SUCCEEDED" : "PARTIAL",
      outcomeSummary: { pipelineStatus: lead.pipelineStatus, status: lead.status },
      realizedConversion: won ? 1 : 0,
    });
  } catch (e) {
    playbookLog.error("evaluateLeadOutcome failed", {
      memoryRecordId,
      message: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

export async function evaluateDealOutcome(memoryRecordId: string, dealId: string): Promise<void> {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { status: true, priceCents: true },
    });
    if (!deal) {
      await recordOutcomeUpdate({
        memoryRecordId,
        outcomeStatus: "NEUTRAL",
        outcomeSummary: { reason: "deal_missing" },
      });
      return;
    }
    const closed = ["closed", "completed", "won"].includes(deal.status?.toLowerCase?.() ?? "");
    await recordOutcomeUpdate({
      memoryRecordId,
      outcomeStatus: closed ? "SUCCEEDED" : deal.status === "cancelled" ? "CANCELLED" : "PARTIAL",
      outcomeSummary: { status: deal.status },
      realizedValue: deal.priceCents ?? undefined,
      realizedConversion: closed ? 1 : 0,
    });
  } catch (e) {
    playbookLog.error("evaluateDealOutcome failed", {
      memoryRecordId,
      message: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

export async function evaluateBookingOutcome(memoryRecordId: string, bookingId: string): Promise<void> {
  try {
    const b = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true, totalCents: true },
    });
    if (!b) {
      await recordOutcomeUpdate({
        memoryRecordId,
        outcomeStatus: "NEUTRAL",
        outcomeSummary: { reason: "booking_missing" },
      });
      return;
    }
    const ok = ["confirmed", "completed"].includes(String(b.status).toLowerCase());
    await recordOutcomeUpdate({
      memoryRecordId,
      outcomeStatus: ok ? "SUCCEEDED" : String(b.status).toLowerCase() === "cancelled" ? "CANCELLED" : "PARTIAL",
      outcomeSummary: { status: b.status },
      realizedValue: b.totalCents ?? undefined,
      realizedConversion: ok ? 1 : 0,
    });
  } catch (e) {
    playbookLog.error("evaluateBookingOutcome failed", {
      memoryRecordId,
      message: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

export async function evaluateListingOutcome(memoryRecordId: string, listingId: string): Promise<void> {
  try {
    const l = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { id: true, listingCode: true },
    });
    await recordOutcomeUpdate({
      memoryRecordId,
      outcomeStatus: l ? "NEUTRAL" : "FAILED",
      outcomeSummary: l ? { listingCode: l.listingCode } : { reason: "listing_missing" },
    });
  } catch (e) {
    playbookLog.error("evaluateListingOutcome failed", {
      memoryRecordId,
      message: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}
