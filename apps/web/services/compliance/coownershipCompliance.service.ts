import type {
  ChecklistItem,
  ComplianceChecklistItemStatus,
  ComplianceVerificationLevel,
  LecipmListingAssetType,
} from "@prisma/client";
import { logCoOwnershipAudit } from "./coownershipAudit.service";
import { isCriticalRowExpired } from "./coownershipValidity.service";
import type { RetrofitUpstreamFingerprint } from "@/modules/esg/esg-retrofit-upstream-refresh";
import { complianceFlags } from "@/config/feature-flags";
import { bumpMergedComplianceMetric } from "@/lib/compliance/coownership-compliance-metrics";
import { prisma } from "@/lib/db";
import {
  CONDITIONAL_INSURANCE_TRIGGER_KEYS,
  CONDITIONAL_WHEN_INSURANCE_GAP_KEYS,
  CRITICAL_COMPLIANCE_BLOCK_KEYS,
  DEF_BY_MERGED_KEY,
  INSURANCE_GATE_KEYS,
  MERGED_COOWNERSHIP_CHECKLIST,
  MERGED_KEYS,
  type MergedChecklistDef,
} from "./coownership-merged-definitions";

const NS = "[compliance]";

function log(event: string, payload?: Record<string, unknown>): void {
  try {
    if (payload) console.info(`${NS} ${event}`, JSON.stringify(payload));
    else console.info(`${NS} ${event}`);
  } catch {
    /* never throw */
  }
}

export function logComplianceEvent(event: string, payload: Record<string, unknown>): void {
  log(event, payload);
}

/** Primary certificate gate for autopilot / enforcement */
export const COOWNERSHIP_CRITICAL_KEY = "coownership_certificate_received" as const;

export { INSURANCE_GATE_KEYS, CRITICAL_COMPLIANCE_BLOCK_KEYS, MERGED_COOWNERSHIP_CHECKLIST };

/** Back-compat name for autopilot checklist keys export */
export const COOWNERSHIP_CHECKLIST_DEFINITIONS = MERGED_COOWNERSHIP_CHECKLIST;

export type CoownershipChecklistDefinition = MergedChecklistDef;

const PRIORITY_WEIGHT: Record<MergedChecklistDef["priority"], number> = {
  CRITICAL: 12,
  HIGH: 8,
  MEDIUM: 4,
  LOW: 2,
};

export function listingRequiresCoownershipChecklist(row: {
  listingType: LecipmListingAssetType;
  isCoOwnership: boolean;
}): boolean {
  return row.listingType === "CONDO" || row.isCoOwnership === true;
}

export function itemSatisfied(status: ComplianceChecklistItemStatus | undefined): boolean {
  return status === "COMPLETED" || status === "NOT_APPLICABLE";
}

export type ComplianceStatusPayload = {
  applies: boolean;
  listingType: LecipmListingAssetType;
  isCoOwnership: boolean;
  listingId?: string;
  items: Pick<
    ChecklistItem,
    | "id"
    | "key"
    | "label"
    | "status"
    | "required"
    | "category"
    | "priority"
    | "description"
    | "source"
    | "verificationLevel"
    | "verifiedAt"
    | "verifiedByUserId"
    | "supportingDocumentIds"
    | "validUntil"
    | "isExpired"
    | "isOverridden"
    | "overrideReason"
  >[];
  complete: boolean;
  certificateComplete: boolean;
  insuranceGateComplete: boolean;
  complianceReady: boolean;
  coownershipPercent?: number;
  insurancePercent?: number;
  overallPercent?: number;
  blockingIssues?: string[];
  warnings?: string[];
  recommendation?: string;
};

export type MergedComplianceGrouped = {
  coownership: { items: ChecklistItem[]; percent: number };
  insurance: { items: ChecklistItem[]; percent: number };
};

export async function ensureMergedCoOwnershipChecklist(listingId: string): Promise<{ createdKeys: string[] }> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, listingType: true, isCoOwnership: true },
  });
  if (!listing) throw new Error("Listing not found");

  if (!listingRequiresCoownershipChecklist(listing)) {
    return { createdKeys: [] };
  }

  const before = await prisma.checklistItem.count({
    where: { listingId, key: { in: [...MERGED_KEYS] } },
  });

  const data = MERGED_COOWNERSHIP_CHECKLIST.map((def) => ({
    listingId,
    category: def.category,
    key: def.key,
    label: def.label,
    description: def.description ?? null,
    priority: def.priority,
    required: def.required,
    source: def.source ?? null,
    status: "PENDING" as ComplianceChecklistItemStatus,
  }));

  const inserted = await prisma.checklistItem.createMany({ data, skipDuplicates: true });
  const after = await prisma.checklistItem.count({
    where: { listingId, key: { in: [...MERGED_KEYS] } },
  });

  if (after > before || inserted.count > 0) {
    log("merged_checklist_created", { listingId, inserted: inserted.count, mergedRows: after });
    bumpMergedComplianceMetric("mergedChecklistCreated");
  }

  return { createdKeys: MERGED_COOWNERSHIP_CHECKLIST.map((d) => d.key) };
}

/** @deprecated Use ensureMergedCoOwnershipChecklist */
export const ensureCoOwnershipChecklist = ensureMergedCoOwnershipChecklist;

export function detectInsuranceDocumentationGap(
  items: Pick<ChecklistItem, "key" | "status">[],
): boolean {
  return CONDITIONAL_INSURANCE_TRIGGER_KEYS.some((k) => {
    const st = items.find((i) => i.key === k)?.status;
    return !itemSatisfied(st);
  });
}

export function getConditionalInsuranceRequirements(listingId: string | null, items: Pick<ChecklistItem, "key" | "status">[]) {
  const gap = detectInsuranceDocumentationGap(items);
  const conditionalRequiredKeys = gap ? [...CONDITIONAL_WHEN_INSURANCE_GAP_KEYS] : [];
  return { gap, conditionalRequiredKeys };
}

function effectiveRequired(
  def: MergedChecklistDef,
  items: Pick<ChecklistItem, "key" | "status">[],
): boolean {
  if (def.required) return true;
  const { conditionalRequiredKeys } = getConditionalInsuranceRequirements(null, items);
  return conditionalRequiredKeys.includes(def.key);
}

function scoreCategory(
  defs: readonly MergedChecklistDef[],
  items: Pick<ChecklistItem, "key" | "status">[],
  category: MergedChecklistDef["category"],
): number {
  let max = 0;
  let earned = 0;
  for (const def of defs) {
    if (def.category !== category) continue;
    if (!effectiveRequired(def, items)) continue;
    const w = PRIORITY_WEIGHT[def.priority];
    max += w;
    const st = items.find((i) => i.key === def.key)?.status;
    if (itemSatisfied(st)) earned += w;
  }
  return max === 0 ? 100 : Math.round((earned / max) * 100);
}

export async function getMergedComplianceChecklist(listingId: string): Promise<MergedComplianceGrouped | null> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { listingType: true, isCoOwnership: true },
  });
  if (!listing || !listingRequiresCoownershipChecklist(listing)) return null;

  await ensureMergedCoOwnershipChecklist(listingId);

  const items = await prisma.checklistItem.findMany({
    where: { listingId, key: { in: [...MERGED_KEYS] } },
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });

  const itemPick = items.map((i) => ({ key: i.key, status: i.status }));
  const coPct = scoreCategory(MERGED_COOWNERSHIP_CHECKLIST, itemPick, "COOWNERSHIP");
  const insPct = scoreCategory(MERGED_COOWNERSHIP_CHECKLIST, itemPick, "INSURANCE");

  return {
    coownership: {
      items: items.filter((i) => i.category === "COOWNERSHIP"),
      percent: coPct,
    },
    insurance: {
      items: items.filter((i) => i.category === "INSURANCE"),
      percent: insPct,
    },
  };
}

function buildRecommendation(params: {
  certificateComplete: boolean;
  insuranceGateComplete: boolean;
  complete: boolean;
  gap: boolean;
}): string {
  const parts: string[] = [];
  if (!params.certificateComplete) {
    parts.push(
      "This property is divided co-ownership — request the certificate of co-ownership condition from the syndicate as early as possible to reduce transaction delays.",
    );
  }
  if (params.gap || !params.insuranceGateComplete) {
    parts.push(
      "Mandatory syndicate insurance or liability coverage has not been fully confirmed in the checklist — inform the buyer and consider a conditional clause where appropriate.",
    );
  }
  if (params.complete && params.insuranceGateComplete && params.certificateComplete) {
    parts.push("Co-ownership compliance is substantially complete — review any remaining items before publishing or accepting an offer.");
  } else if (!params.complete && params.certificateComplete && params.insuranceGateComplete) {
    parts.push("Co-ownership compliance is almost complete — finish remaining high-priority checklist rows.");
  }
  if (parts.length === 0) {
    return "Maintain syndicate and insurance documentation in file through closing — platform guidance only.";
  }
  return parts.join(" ");
}

function collectBlockingAndWarnings(
  rows: Pick<ChecklistItem, "key" | "status">[],
): {
  blockingIssues: string[];
  warnings: string[];
} {
  const itemPick = rows.map((r) => ({ key: r.key, status: r.status }));
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  for (const row of rows) {
    if (itemSatisfied(row.status)) continue;
    const def = DEF_BY_MERGED_KEY.get(row.key);
    if (!def || !effectiveRequired(def, itemPick)) continue;
    if (def.priority === "CRITICAL") blockingIssues.push(def.label);
    else if (def.priority === "HIGH") warnings.push(def.label);
  }
  return { blockingIssues, warnings };
}

export async function getMergedComplianceStatus(listingId: string): Promise<ComplianceStatusPayload> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { listingType: true, isCoOwnership: true },
  });
  if (!listing) throw new Error("Listing not found");

  const applies = listingRequiresCoownershipChecklist(listing);
  if (!applies) {
    return {
      applies: false,
      listingType: listing.listingType,
      isCoOwnership: listing.isCoOwnership,
      listingId,
      items: [],
      complete: true,
      certificateComplete: true,
      insuranceGateComplete: true,
      complianceReady: true,
      coownershipPercent: 100,
      insurancePercent: 100,
      overallPercent: 100,
      blockingIssues: [],
      warnings: [],
      recommendation: "Co-ownership checklist does not apply to this listing classification.",
    };
  }

  await ensureMergedCoOwnershipChecklist(listingId);

  // Part 3: Refresh expiry status before computing status
  const { refreshListingComplianceExpiry } = await import("./coownershipValidity.service");
  await refreshListingComplianceExpiry(listingId).catch(() => null);

  const items = await prisma.checklistItem.findMany({
    where: { listingId, key: { in: [...MERGED_KEYS] } },
    orderBy: [{ category: "asc" }, { key: "asc" }],
    select: {
      id: true,
      key: true,
      label: true,
      status: true,
      required: true,
      category: true,
      priority: true,
      description: true,
      source: true,
      verificationLevel: true,
      verifiedAt: true,
      verifiedByUserId: true,
      supportingDocumentIds: true,
      validUntil: true,
      isExpired: true,
      isOverridden: true,
      overrideReason: true,
    },
  });

  const itemPick = items.map((i) => ({ 
    key: i.key, 
    status: i.status, 
    verificationLevel: i.verificationLevel, 
    isExpired: i.isExpired,
    isOverridden: i.isOverridden,
  }));
  const { gap } = getConditionalInsuranceRequirements(listingId, itemPick);

  const requiredRows = MERGED_COOWNERSHIP_CHECKLIST.filter((def) => effectiveRequired(def, itemPick));

  const verificationEnforcement = complianceFlags.coownershipVerificationEnforcement === true;
  const expiryEnforcement = complianceFlags.coownershipExpiryEnforcement === true;

  const isRowReady = (row: typeof items[0]) => {
    if (row.isOverridden) return true;
    if (!itemSatisfied(row.status)) return false;
    
    // Part 1: Insurance gate keys require at least DOCUMENTED if enforcement is on
    if (verificationEnforcement && INSURANCE_GATE_KEYS.includes(row.key as any)) {
      if (row.verificationLevel === "DECLARED") return false;
    }

    // Part 3: Block if expired critical rows
    if (expiryEnforcement && isCriticalRowExpired(row)) {
      return false;
    }

    return true;
  };

  const complete =
    requiredRows.length > 0 &&
    requiredRows.every((def) => {
      const row = items.find((i) => i.key === def.key);
      return row && isRowReady(row);
    });

  const certRow = items.find((i) => i.key === COOWNERSHIP_CRITICAL_KEY);
  const certificateComplete = certRow ? isRowReady(certRow) : false;

  const insuranceGateComplete = INSURANCE_GATE_KEYS.every((k) => {
    const row = items.find((i) => i.key === k);
    return row && isRowReady(row);
  });

  const coPct = scoreCategory(MERGED_COOWNERSHIP_CHECKLIST, itemPick, "COOWNERSHIP");
  const insPct = scoreCategory(MERGED_COOWNERSHIP_CHECKLIST, itemPick, "INSURANCE");
  const overallPercent = Math.round((coPct + insPct) / 2);

  const { blockingIssues, warnings } = collectBlockingAndWarnings(items);

  const recommendation = buildRecommendation({
    certificateComplete,
    insuranceGateComplete,
    complete,
    gap,
  });

  const complianceReady = Boolean(complete && certificateComplete && insuranceGateComplete);

  return {
    applies: true,
    listingType: listing.listingType,
    isCoOwnership: listing.isCoOwnership,
    listingId,
    items,
    complete,
    certificateComplete,
    insuranceGateComplete,
    complianceReady,
    coownershipPercent: coPct,
    insurancePercent: insPct,
    overallPercent,
    blockingIssues,
    warnings,
    recommendation,
  };
}

/** @deprecated alias */
export const getComplianceStatus = getMergedComplianceStatus;

export async function isMergedComplianceComplete(listingId: string): Promise<boolean> {
  const s = await getMergedComplianceStatus(listingId);
  return s.complete;
}

export async function isComplianceComplete(listingId: string): Promise<boolean> {
  return isMergedComplianceComplete(listingId);
}

export async function getCriticalComplianceComplete(listingId: string): Promise<boolean> {
  await ensureMergedCoOwnershipChecklist(listingId);
  const items = await prisma.checklistItem.findMany({
    where: { listingId, key: { in: [...CRITICAL_COMPLIANCE_BLOCK_KEYS] } },
    select: { key: true, status: true },
  });
  return CRITICAL_COMPLIANCE_BLOCK_KEYS.every((k) =>
    itemSatisfied(items.find((i) => i.key === k)?.status),
  );
}

export function computeInsuranceGateComplete(
  items: Pick<ChecklistItem, "key" | "status">[],
): boolean {
  return INSURANCE_GATE_KEYS.every((k) => itemSatisfied(items.find((i) => i.key === k)?.status));
}

export async function recomputeComplianceSnapshot(listingId: string): Promise<void> {
  const status = await getMergedComplianceStatus(listingId);
  if (!status.applies) return;

  let fpBefore: RetrofitUpstreamFingerprint | null = null;
  try {
    const mod = await import("@/modules/esg/esg-retrofit-upstream-refresh");
    fpBefore = await mod.captureRetrofitUpstreamFingerprint(listingId);
  } catch {
    /* optional module load */
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      complianceScore: status.coownershipPercent ?? null,
      insuranceScore: status.insurancePercent ?? null,
    },
  });

  await prisma.listingComplianceSnapshot.upsert({
    where: { listingId },
    create: {
      listingId,
      compliancePercent: status.coownershipPercent ?? null,
      insurancePercent: status.insurancePercent ?? null,
      overallPercent: status.overallPercent ?? null,
      blockingIssuesJson: status.blockingIssues ?? [],
      recommendationText: status.recommendation ?? null,
    },
    update: {
      compliancePercent: status.coownershipPercent ?? null,
      insurancePercent: status.insurancePercent ?? null,
      overallPercent: status.overallPercent ?? null,
      blockingIssuesJson: status.blockingIssues ?? [],
      recommendationText: status.recommendation ?? null,
    },
  });

  try {
    const mod = await import("@/modules/esg/esg-retrofit-upstream-refresh");
    mod.scheduleDebouncedRetrofitUpstreamRefresh(listingId, "acquisition", fpBefore);
  } catch {
    /* optional */
  }

  log("compliance_snapshot_recomputed", {
    listingId,
    overallPercent: status.overallPercent,
    blockingCount: status.blockingIssues?.length ?? 0,
  });
  bumpMergedComplianceMetric("snapshotsRecomputed");
}

export async function setChecklistItemStatus(
  listingId: string,
  key: string,
  status: ComplianceChecklistItemStatus,
  completedByUserId?: string | null,
): Promise<ChecklistItem> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { listingType: true, isCoOwnership: true },
  });
  if (!listing) throw new Error("Listing not found");
  if (!listingRequiresCoownershipChecklist(listing)) {
    throw new Error("Co-ownership checklist does not apply to this listing");
  }

  if (!MERGED_KEYS.has(key)) throw new Error("Unknown checklist key");

  await ensureMergedCoOwnershipChecklist(listingId);

  const currentItem = await prisma.checklistItem.findUnique({
    where: { listingId_key: { listingId, key } },
  });

  const now = new Date();
  const completed =
    status === "COMPLETED"
      ? { completedAt: now, completedByUserId: completedByUserId ?? null }
      : { completedAt: null, completedByUserId: null };

  const updated = await prisma.checklistItem.update({
    where: { listingId_key: { listingId, key } },
    data: {
      status,
      ...completed,
    },
  });

  await logCoOwnershipAudit({
    listingId,
    actorId: completedByUserId ?? undefined,
    event: "CHECKLIST_UPDATE",
    beforeValue: { status: currentItem?.status },
    afterValue: { status },
    reason: `Status updated to ${status}`,
  }).catch(() => null);

  log("checklist_item_completed", { listingId, key, status });
  bumpMergedComplianceMetric("checklistItemUpdates");

  await recomputeComplianceSnapshot(listingId).catch(() => null);

  try {
    const { invalidateComplianceStatusCache } = await import("@/lib/compliance/coownership-compliance-cache");
    invalidateComplianceStatusCache(listingId);
  } catch {
    /* optional */
  }

  return updated;
}

/** Back-compat: marks completed */
export async function setChecklistItemCompleted(listingId: string, key: string): Promise<ChecklistItem> {
  return setChecklistItemStatus(listingId, key, "COMPLETED");
}

export type CoownershipEnforcementAction = "publish" | "accept_offer";

export const ERR_COOWNERSHIP_PUBLISH = "Complete co-ownership compliance before publishing.";
export const ERR_COOWNERSHIP_ACCEPT_OFFER = "Complete co-ownership compliance before accepting this offer.";
export const ERR_COOWNERSHIP_INSURANCE_GATE =
  "Complete mandatory insurance verification (co-owner liability tier, syndicate building insurance, syndicate liability) before proceeding — platform checklist only.";
export const ERR_CRITICAL_COOWNERSHIP_COMPLIANCE =
  "Critical co-ownership compliance items are missing. Complete certificate and insurance verification before proceeding.";
export const ERR_COOWNERSHIP_VERIFICATION_REQUIRED =
  "Insurance and critical checklist items require 'DOCUMENTED' or 'VERIFIED' status with supporting evidence.";
export const ERR_COOWNERSHIP_EXPIRY_BLOCKED =
  "One or more critical co-ownership compliance documents have expired. Please update with current documentation.";

function legacyFullEnforcement(): boolean {
  return complianceFlags.coownershipEnforcement === true;
}

function complianceCriticalEnforcement(): boolean {
  return complianceFlags.coownershipComplianceEnforcement === true;
}

function insuranceEnforcementEnabled(): boolean {
  return complianceFlags.coownershipInsuranceEnforcement === true;
}

function verificationEnforcementEnabled(): boolean {
  return complianceFlags.coownershipVerificationEnforcement === true;
}

function expiryEnforcementEnabled(): boolean {
  return complianceFlags.coownershipExpiryEnforcement === true;
}

export async function assertCoownershipEnforcementAllows(
  listingId: string,
  action: CoownershipEnforcementAction,
): Promise<void> {
  if (
    !complianceCriticalEnforcement() &&
    !legacyFullEnforcement() &&
    !insuranceEnforcementEnabled() &&
    !verificationEnforcementEnabled() &&
    !expiryEnforcementEnabled()
  )
    return;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { listingType: true, isCoOwnership: true },
  });
  if (!listing) return;

  if (!listingRequiresCoownershipChecklist(listing)) return;

  await ensureMergedCoOwnershipChecklist(listingId);

  const status = await getMergedComplianceStatus(listingId);

  if (complianceCriticalEnforcement()) {
    if (!status.certificateComplete || !status.insuranceGateComplete) {
      log("critical_block_triggered", { listingId, action });
      bumpMergedComplianceMetric("criticalBlocks");
      throw new Error(ERR_CRITICAL_COOWNERSHIP_COMPLIANCE);
    }
  }

  if (legacyFullEnforcement()) {
    if (!status.complete) {
      log("compliance_blocked_action", { listingId, action, reason: "checklist_incomplete" });
      throw new Error(action === "publish" ? ERR_COOWNERSHIP_PUBLISH : ERR_COOWNERSHIP_ACCEPT_OFFER);
    }
  }

  if (insuranceEnforcementEnabled()) {
    if (!status.insuranceGateComplete) {
      log("compliance_blocked_action", { listingId, action, reason: "insurance_gate_incomplete" });
      throw new Error(ERR_COOWNERSHIP_INSURANCE_GATE);
    }
  }

  // Part 1: Verification level check
  if (verificationEnforcementEnabled()) {
    const unverifiedCritical = status.items.filter(
      (i) =>
        (CRITICAL_COMPLIANCE_BLOCK_KEYS.includes(i.key as any) ||
          INSURANCE_GATE_KEYS.includes(i.key as any)) &&
        !i.isOverridden &&
        itemSatisfied(i.status) &&
        i.verificationLevel === "DECLARED"
    );
    if (unverifiedCritical.length > 0) {
      log("compliance_blocked_action", { listingId, action, reason: "verification_required" });
      throw new Error(ERR_COOWNERSHIP_VERIFICATION_REQUIRED);
    }
  }

  // Part 3: Expiry check
  if (expiryEnforcementEnabled()) {
    const expiredCritical = status.items.filter((i) => !i.isOverridden && isCriticalRowExpired(i));
    if (expiredCritical.length > 0) {
      log("compliance_blocked_action", { listingId, action, reason: "expiry_blocked" });
      throw new Error(ERR_COOWNERSHIP_EXPIRY_BLOCKED);
    }
  }
}

export async function assertCoownershipPublishAllowed(listingId: string): Promise<void> {
  await assertCoownershipEnforcementAllows(listingId, "publish");
}

export async function setChecklistItemVerification(
  listingId: string,
  key: string,
  verificationLevel: ComplianceVerificationLevel,
  verifiedByUserId?: string | null
): Promise<ChecklistItem> {
  const currentItem = await prisma.checklistItem.findUnique({
    where: { listingId_key: { listingId, key } },
  });

  const updated = await prisma.checklistItem.update({
    where: { listingId_key: { listingId, key } },
    data: {
      verificationLevel,
      verifiedAt: verificationLevel !== "DECLARED" ? new Date() : null,
      verifiedByUserId: verificationLevel !== "DECLARED" ? verifiedByUserId : null,
    },
  });

  await logCoOwnershipAudit({
    listingId,
    actorId: verifiedByUserId ?? undefined,
    event: "VERIFICATION_UPGRADE",
    beforeValue: { level: currentItem?.verificationLevel },
    afterValue: { level: verificationLevel },
    reason: `Verification level set to ${verificationLevel}`,
  }).catch(() => null);

  await recomputeComplianceSnapshot(listingId).catch(() => null);
  return updated;
}

export async function overrideChecklistItemCompliance(
  listingId: string,
  key: string,
  override: boolean,
  reason: string,
  overriddenByUserId: string
): Promise<ChecklistItem> {
  const currentItem = await prisma.checklistItem.findUnique({
    where: { listingId_key: { listingId, key } },
  });

  const updated = await prisma.checklistItem.update({
    where: { listingId_key: { listingId, key } },
    data: {
      isOverridden: override,
      overrideReason: override ? reason : null,
      overriddenByUserId: override ? overriddenByUserId : null,
    },
  });

  await logCoOwnershipAudit({
    listingId,
    actorId: overriddenByUserId,
    event: "OVERRIDE",
    beforeValue: { overridden: currentItem?.isOverridden },
    afterValue: { overridden: override },
    reason: override ? `Admin override: ${reason}` : "Override removed",
  }).catch(() => null);

  await recomputeComplianceSnapshot(listingId).catch(() => null);
  return updated;
}
