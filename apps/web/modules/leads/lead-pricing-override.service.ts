/**
 * Operator overrides — internal advisory records only. Does not mutate lead unlock fields or revenue engines.
 */

import type { LeadPricingOverride, LeadPricingOverrideStatus } from "@/modules/leads/lead-pricing-experiments.types";
import {
  monitorOverrideCleared,
  monitorOverrideCreated,
  monitorOverrideSuperseded,
  recordLeadPricingOverrideAuditLine,
} from "@/modules/leads/lead-pricing-experiments-monitoring.service";
import { prisma } from "@/lib/db";
import { tryRecordLeadPricingResultOnOverride } from "@/modules/leads/lead-pricing-results.service";

export type ListLeadPricingOverridesParams = {
  leadId: string;
  /** Max rows including non-active history */
  take?: number;
};

export function validateOverrideReason(reason: unknown): string | null {
  if (typeof reason !== "string") return null;
  const t = reason.trim();
  return t.length > 0 ? t : null;
}

export function mapPricingOverrideRow(row: {
  id: string;
  leadId: string;
  basePrice: number;
  systemSuggestedPrice: number;
  overridePrice: number;
  reason: string;
  createdByUserId: string;
  createdAt: Date;
  status: string;
}): LeadPricingOverride {
  return {
    id: row.id,
    leadId: row.leadId,
    basePrice: row.basePrice,
    systemSuggestedPrice: row.systemSuggestedPrice,
    overridePrice: row.overridePrice,
    reason: row.reason,
    createdBy: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    status: row.status as LeadPricingOverrideStatus,
  };
}

export async function getActiveLeadPricingOverride(leadId: string): Promise<LeadPricingOverride | null> {
  const row = await prisma.leadPricingOverride.findFirst({
    where: { leadId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  return row ? mapPricingOverrideRow(row) : null;
}

export async function listLeadPricingOverrides(
  params: ListLeadPricingOverridesParams,
): Promise<LeadPricingOverride[]> {
  const take = Math.min(Math.max(params.take ?? 40, 1), 200);
  const rows = await prisma.leadPricingOverride.findMany({
    where: { leadId: params.leadId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(mapPricingOverrideRow);
}

export type CreateLeadPricingOverrideInput = {
  leadId: string;
  actorUserId: string;
  basePrice: number;
  systemSuggestedPrice: number;
  overridePrice: number;
  reason: string;
};

export async function createLeadPricingOverride(
  input: CreateLeadPricingOverrideInput,
): Promise<LeadPricingOverride> {
  const reason = validateOverrideReason(input.reason);
  if (!reason) {
    throw new Error("Override reason is required.");
  }
  const op = Math.round(input.overridePrice);
  const bp = Math.round(input.basePrice);
  const sys = Math.round(input.systemSuggestedPrice);
  if (!Number.isFinite(op) || op <= 0) {
    throw new Error("Override price must be a positive finite dollar amount.");
  }
  if (!Number.isFinite(bp) || bp < 0 || !Number.isFinite(sys) || sys < 0) {
    throw new Error("Invalid base or system suggested snapshot.");
  }

  const { row: created, supersededId } = await prisma.$transaction(async (tx) => {
    const existing = await tx.leadPricingOverride.findFirst({
      where: { leadId: input.leadId, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    let superseded: string | null = null;
    if (existing) {
      await tx.leadPricingOverride.update({
        where: { id: existing.id },
        data: { status: "superseded", updatedAt: new Date() },
      });
      superseded = existing.id;
      recordLeadPricingOverrideAuditLine({
        action: "superseded",
        leadId: input.leadId,
        actorUserId: input.actorUserId,
        reason,
        previous: { overridePrice: existing.overridePrice, status: existing.status },
      });
    }

    const row = await tx.leadPricingOverride.create({
      data: {
        leadId: input.leadId,
        basePrice: bp,
        systemSuggestedPrice: sys,
        overridePrice: op,
        reason,
        createdByUserId: input.actorUserId,
        status: "active",
      },
    });

    return { row, supersededId: superseded };
  });

  if (supersededId) {
    monitorOverrideSuperseded({
      leadId: input.leadId,
      previousOverrideId: supersededId,
      newOverrideId: created.id,
      actorUserId: input.actorUserId,
    });
  }

  monitorOverrideCreated({
    leadId: input.leadId,
    overrideId: created.id,
    actorUserId: input.actorUserId,
    basePrice: bp,
    systemSuggestedPrice: sys,
    overridePrice: op,
  });
  recordLeadPricingOverrideAuditLine({
    action: "created",
    leadId: input.leadId,
    actorUserId: input.actorUserId,
    reason,
    next: { overridePrice: op, status: "active" },
  });

  void tryRecordLeadPricingResultOnOverride({
    leadId: input.leadId,
    overridePrice: op,
    basePrice: bp,
    systemSuggestedPrice: sys,
  });

  return mapPricingOverrideRow(created);
}

export async function clearLeadPricingOverride(
  leadId: string,
  actorUserId: string,
): Promise<LeadPricingOverride | null> {
  const active = await prisma.leadPricingOverride.findFirst({
    where: { leadId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  if (!active) return null;

  const updated = await prisma.leadPricingOverride.update({
    where: { id: active.id },
    data: {
      status: "cleared",
      clearedAt: new Date(),
      clearedByUserId: actorUserId,
    },
  });

  monitorOverrideCleared({ leadId, overrideId: updated.id, actorUserId });
  recordLeadPricingOverrideAuditLine({
    action: "cleared",
    leadId,
    actorUserId,
    previous: { overridePrice: active.overridePrice, status: active.status },
    next: { status: "cleared" },
  });

  return mapPricingOverrideRow(updated);
}
