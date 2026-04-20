import { isCondoPropertyType } from "@/lib/fsbo/seller-declaration-validation";
import type { CoownershipAutopilotStore } from "./coownership-autopilot.store";
import type {
  CoownershipActionType,
  CoownershipAutopilotMode,
  CoownershipAutopilotResult,
  CoownershipAutopilotTrigger,
  CoownershipChecklistItem,
  CoownershipListingInput,
} from "./coownership-autopilot.types";

const NS = "[autopilot][coownership]";

function log(line: string, payload?: Record<string, unknown>): void {
  try {
    if (payload) console.info(`${NS} ${line}`, JSON.stringify(payload));
    else console.info(`${NS} ${line}`);
  } catch {
    /* never throw */
  }
}

/** Whether divided co-ownership compliance applies (condo type, declaration path, or explicit override). */
export function requiresCoownershipCompliance(listing: CoownershipListingInput): boolean {
  if (listing.isCoOwnership === true) return true;
  if (isCondoPropertyType(listing.propertyType)) return true;
  if (listing.sellerDeclarationJson?.isCondo === true) return true;
  return false;
}

/**
 * “Certificate” = minimum declaration signals for co-ownership file readiness.
 * When compliance does not apply, treated as complete (no gate).
 */
export function isCoownershipCertificateComplete(listing: CoownershipListingInput): boolean {
  if (!requiresCoownershipCompliance(listing)) return true;
  const d = listing.sellerDeclarationJson;
  if (!d?.isCondo) return false;
  return !!(
    d.condoRulesReviewed &&
    d.condoSyndicateDocumentsAvailable &&
    d.condoFinancialStatementsAvailable
  );
}

const DEFAULT_CHECKLIST_DEF: { key: string; label: string }[] = [
  {
    key: "coownership_certificate",
    label: "Co-ownership / syndicate disclosure package reviewed",
  },
  {
    key: "syndicate_financials",
    label: "Syndicate financial statements and contingency context captured",
  },
];

export function defaultCycleKey(trigger: CoownershipAutopilotTrigger, isoDay?: string): string {
  const day = isoDay ?? new Date().toISOString().slice(0, 10);
  return `${day}:${trigger}`;
}

/** Idempotent checklist rows — unique per (listingId, key) in store. */
export async function ensureCoOwnershipChecklist(
  store: CoownershipAutopilotStore,
  listing: CoownershipListingInput,
): Promise<string[]> {
  const certDone = isCoownershipCertificateComplete(listing);
  const keys: string[] = [];
  for (const def of DEFAULT_CHECKLIST_DEF) {
    const done =
      def.key === "coownership_certificate"
        ? certDone
        : def.key === "syndicate_financials"
          ? !!(listing.sellerDeclarationJson?.condoFinancialStatementsAvailable && certDone)
          : false;
    const item: CoownershipChecklistItem = { key: def.key, label: def.label, done };
    await store.upsertChecklistItem(listing.id, item);
    keys.push(def.key);
  }
  log("checklist ensured", { listingId: listing.id, keys });
  return keys;
}

async function handleComplianceTransition(
  store: CoownershipAutopilotStore,
  listing: CoownershipListingInput,
  nowApplies: boolean,
): Promise<void> {
  const prev = await store.getComplianceApplicable(listing.id);
  if (prev === true && nowApplies === false) {
    await store.deleteChecklistItemsForListing(listing.id);
    log("compliance removed (e.g. type → house)", { listingId: listing.id });
  }
  if (prev === false && nowApplies === true) {
    log("compliance added (e.g. type → condo)", { listingId: listing.id });
  }
  await store.setComplianceApplicable(listing.id, nowApplies);
}

export async function runCoownershipAutopilot(args: {
  store: CoownershipAutopilotStore;
  listing: CoownershipListingInput;
  mode: CoownershipAutopilotMode;
  trigger: CoownershipAutopilotTrigger;
  /** Dedup decisions per listing + cycle (e.g. ISO day + trigger class). */
  cycleKey?: string;
  /** Fixed clock for tests — defaults to UTC date */
  isoDay?: string;
}): Promise<CoownershipAutopilotResult> {
  const { store, listing, mode, trigger } = args;
  const cycleKey =
    args.cycleKey ?? defaultCycleKey(trigger, args.isoDay ?? new Date().toISOString().slice(0, 10));

  log("triggered", {
    listingId: listing.id,
    trigger,
    mode,
    cycleKey,
  });

  const complianceApplies = requiresCoownershipCompliance(listing);
  await handleComplianceTransition(store, listing, complianceApplies);

  const certificateComplete = isCoownershipCertificateComplete(listing);
  let checklistEnsured = false;
  let checklistItemKeys: string[] = [];
  let recommendation: string | null = null;
  let action: CoownershipActionType = "NONE";
  let blockReason: string | null = null;
  let decisionEmitted = false;
  let complianceDecisionId: string | null = null;

  if (!complianceApplies || mode === "OFF") {
    log(mode === "OFF" ? "mode off — no actions" : "compliance not applicable", {
      listingId: listing.id,
    });
    return {
      listingId: listing.id,
      trigger,
      mode,
      cycleKey,
      complianceApplies,
      decisionEmitted: false,
      complianceDecisionId: null,
      action: "NONE",
      checklistEnsured: false,
      checklistItemKeys: [],
      recommendation: null,
      blockReason: null,
      certificateComplete,
    };
  }

  const alreadyDecided = await store.hasDecisionForCycle(listing.id, cycleKey);

  if (mode === "ASSIST") {
    action = "RECOMMEND_ONLY";
    if (!certificateComplete) {
      recommendation =
        "Co-ownership file: complete syndicate / declaration review and upload supporting condo documents before publishing.";
    }
    if (!alreadyDecided) {
      await store.recordDecision(listing.id, cycleKey, trigger);
      decisionEmitted = true;
      complianceDecisionId = `${listing.id}:${cycleKey}`;
    }
    return {
      listingId: listing.id,
      trigger,
      mode,
      cycleKey,
      complianceApplies,
      decisionEmitted,
      complianceDecisionId,
      action,
      checklistEnsured: false,
      checklistItemKeys: await store.listChecklistKeys(listing.id),
      recommendation,
      blockReason: null,
      certificateComplete,
    };
  }

  if (mode === "SAFE_AUTOPILOT") {
    checklistItemKeys = await ensureCoOwnershipChecklist(store, listing);
    checklistEnsured = true;
    action = "ENSURE_CHECKLIST";
    if (!alreadyDecided) {
      await store.recordDecision(listing.id, cycleKey, trigger);
      decisionEmitted = true;
      complianceDecisionId = `${listing.id}:${cycleKey}`;
    }
    return {
      listingId: listing.id,
      trigger,
      mode,
      cycleKey,
      complianceApplies,
      decisionEmitted,
      complianceDecisionId,
      action,
      checklistEnsured,
      checklistItemKeys,
      recommendation: null,
      blockReason: null,
      certificateComplete,
    };
  }

  if (mode === "FULL_AUTOPILOT_APPROVAL") {
    checklistItemKeys = await ensureCoOwnershipChecklist(store, listing);
    checklistEnsured = true;
    if (!certificateComplete) {
      action = "BLOCK_ACTION";
      blockReason = "Missing co-ownership certificate";
      log("blocked action", {
        listingId: listing.id,
        reason: blockReason,
        progress: certificateComplete ? 100 : 0,
        confidence: "low",
        blockers: 1,
        route: "coownership_certificate",
      });
      if (!alreadyDecided) {
        await store.recordDecision(listing.id, cycleKey, trigger);
        decisionEmitted = true;
        complianceDecisionId = `${listing.id}:${cycleKey}`;
      }
      return {
        listingId: listing.id,
        trigger,
        mode,
        cycleKey,
        complianceApplies,
        decisionEmitted,
        complianceDecisionId,
        action,
        checklistEnsured,
        checklistItemKeys,
        recommendation: null,
        blockReason,
        certificateComplete,
      };
    }
    action = "ENSURE_CHECKLIST";
    if (!alreadyDecided) {
      await store.recordDecision(listing.id, cycleKey, trigger);
      decisionEmitted = true;
      complianceDecisionId = `${listing.id}:${cycleKey}`;
    }
    return {
      listingId: listing.id,
      trigger,
      mode,
      cycleKey,
      complianceApplies,
      decisionEmitted,
      complianceDecisionId,
      action,
      checklistEnsured,
      checklistItemKeys,
      recommendation: null,
      blockReason: null,
      certificateComplete,
    };
  }

  return {
    listingId: listing.id,
    trigger,
    mode,
    cycleKey,
    complianceApplies,
    decisionEmitted: false,
    complianceDecisionId: null,
    action: "NONE",
    checklistEnsured,
    checklistItemKeys,
    recommendation,
    blockReason,
    certificateComplete,
  };
}
