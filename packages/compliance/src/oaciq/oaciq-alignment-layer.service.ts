import type {
  OaciqComplianceAlignmentAction,
  OaciqComplianceRule,
  Prisma,
} from "@prisma/client";
import { prisma } from "@repo/db";

/**
 * OACIQ *alignment* layer: maps platform checks to brokerage obligations.
 * Not a regulator approval system — the broker remains responsible for professional decisions.
 */
export function oaciqAlignmentEnforcementEnabled(): boolean {
  return process.env.LECIPM_OACIQ_ALIGNMENT_ENFORCEMENT === "1";
}

export class OaciqAlignmentError extends Error {
  readonly failedRuleKeys: string[];
  readonly failedSummaries: { ruleKey: string; title: string; reason: string }[];

  constructor(message: string, failed: { ruleKey: string; title: string; reason: string }[]) {
    super(message);
    this.name = "OaciqAlignmentError";
    this.failedSummaries = failed;
    this.failedRuleKeys = failed.map((f) => f.ruleKey);
  }
}

export type OaciqAlignmentContext = {
  brokerId: string;
  action: OaciqComplianceAlignmentAction;
  listingId?: string | null;
  pipelineDealId?: string | null;
  crmDealId?: string | null;
  sdTransactionId?: string | null;
};

function actionFilter(
  action: OaciqComplianceAlignmentAction,
): Prisma.OaciqComplianceRuleWhereInput {
  if (action === "DEAL_CREATE") return { appliesDealCreate: true };
  if (action === "LISTING_PUBLISH") return { appliesListingPublish: true };
  return { appliesContractGenerate: true };
}

async function ruleSatisfied(
  rule: OaciqComplianceRule,
  ctx: OaciqAlignmentContext,
): Promise<{ ok: boolean; reason: string }> {
  switch (rule.ruleKey) {
    case "alignment_broker_status_disclosure": {
      const u = await prisma.user.findUnique({
        where: { id: ctx.brokerId },
        select: { isOaciqLicensed: true, oaciqLicenseNumber: true },
      });
      const ok = Boolean(u?.isOaciqLicensed && u?.oaciqLicenseNumber?.trim());
      return ok
        ? { ok: true, reason: "" }
        : { ok: false, reason: "Broker OACIQ licence must be recorded on the profile." };
    }
    case "alignment_conflict_interest_disclosure": {
      const orFilters: Prisma.OaciqConflictCheckWhereInput[] = [];
      if (ctx.listingId) orFilters.push({ listingId: ctx.listingId });
      if (ctx.pipelineDealId) orFilters.push({ pipelineDealId: ctx.pipelineDealId });
      if (ctx.crmDealId) {
        const deal = await prisma.deal.findUnique({
          where: { id: ctx.crmDealId },
          select: { listingId: true },
        });
        if (deal?.listingId) orFilters.push({ listingId: deal.listingId });
      }
      if (orFilters.length === 0) {
        return { ok: true, reason: "" };
      }
      const checks = await prisma.oaciqConflictCheck.findMany({
        where: {
          brokerId: ctx.brokerId,
          OR: orFilters,
        },
        select: {
          id: true,
          hasConflict: true,
          brokerConfirmedDeclaration: true,
        },
      });
      const bad = checks.find((c) => c.hasConflict && !c.brokerConfirmedDeclaration);
      return bad
        ? {
            ok: false,
            reason: "Conflict of interest check requires broker confirmation before this action.",
          }
        : { ok: true, reason: "" };
    }
    case "alignment_client_information_transparency": {
      const u = await prisma.user.findUnique({
        where: { id: ctx.brokerId },
        select: { name: true, email: true },
      });
      const ok = Boolean(u?.email?.trim() && u?.name?.trim());
      return ok
        ? { ok: true, reason: "" }
        : { ok: false, reason: "Broker name and email must be present on the account." };
    }
    case "alignment_documentation_completeness": {
      if (ctx.action === "LISTING_PUBLISH" && ctx.listingId) {
        const snap = await prisma.listingComplianceSnapshot.findUnique({
          where: { listingId: ctx.listingId },
          select: { id: true },
        });
        return snap
          ? { ok: true, reason: "" }
          : {
              ok: false,
              reason: "Listing compliance snapshot is required before marketplace publication.",
            };
      }
      if (ctx.action === "CONTRACT_GENERATE" && ctx.crmDealId) {
        const deal = await prisma.deal.findUnique({
          where: { id: ctx.crmDealId },
          select: { id: true },
        });
        return deal
          ? { ok: true, reason: "" }
          : { ok: false, reason: "CRM deal not found for document generation." };
      }
      if (ctx.action === "DEAL_CREATE" && ctx.listingId) {
        const snap = await prisma.listingComplianceSnapshot.findUnique({
          where: { listingId: ctx.listingId },
          select: { id: true },
        });
        return snap
          ? { ok: true, reason: "" }
          : {
              ok: false,
              reason: "Listing compliance snapshot is required when attaching a listing to a new deal.",
            };
      }
      return { ok: true, reason: "" };
    }
    default:
      return { ok: true, reason: "" };
  }
}

/**
 * Runs alignment checks, writes an audit event, and throws when enforcement is on and a rule fails.
 */
export async function enforceOaciqAlignmentOrThrow(ctx: OaciqAlignmentContext): Promise<void> {
  if (!oaciqAlignmentEnforcementEnabled()) return;

  const rules = await prisma.oaciqComplianceRule.findMany({
    where: {
      active: true,
      enforcedBySystem: true,
      ...actionFilter(ctx.action),
    },
    orderBy: { ruleKey: "asc" },
  });

  const failures: { ruleKey: string; title: string; reason: string }[] = [];
  const detailMap: Record<string, string> = {};

  for (const rule of rules) {
    const r = await ruleSatisfied(rule, ctx);
    if (!r.ok) {
      failures.push({ ruleKey: rule.ruleKey, title: rule.title, reason: r.reason });
      detailMap[rule.ruleKey] = r.reason;
    }
  }

  const outcome = failures.length === 0 ? "PASS" : "BLOCK";

  await prisma.oaciqComplianceAlignmentEvent.create({
    data: {
      brokerId: ctx.brokerId,
      action: ctx.action,
      outcome,
      failedRuleKeys: failures.length ? failures.map((f) => f.ruleKey) : undefined,
      listingId: ctx.listingId ?? undefined,
      pipelineDealId: ctx.pipelineDealId ?? undefined,
      crmDealId: ctx.crmDealId ?? undefined,
      sdTransactionId: ctx.sdTransactionId ?? undefined,
      detailsJson:
        failures.length > 0 ? { failures, ...(Object.keys(detailMap).length ? { detailMap } : {}) } : undefined,
    },
  });

  if (failures.length > 0) {
    throw new OaciqAlignmentError(
      "OACIQ alignment checks failed — broker remains responsible for satisfying applicable obligations.",
      failures,
    );
  }
}
