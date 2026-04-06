import { prisma } from "@/lib/db";
import { formatNegotiationDiffSummary, getNegotiationSnapshotForCase } from "@/src/modules/negotiation-chain-engine/application/negotiationSnapshot";
import { getCaseLegalSummary } from "@/src/modules/case-command-center/application/getCaseLegalSummary";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";
import { evaluateDeclarationKnowledgeRules } from "@/src/modules/knowledge/rules/knowledgeRuleEngine";
import { getSellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";
import type {
  CaseHealthBlockerItem,
  CaseHealthSnapshot,
  CaseHealthStatus,
  CaseNegotiationSummary,
  CaseSignatureReadinessStatus,
} from "@/src/modules/case-command-center/domain/case.types";

const MAX_ITEMS = 5;

export function sectionKeyForFieldKey(fieldKey: string): string | undefined {
  for (const sec of getSellerDeclarationSections()) {
    if (sec.fields.some((f) => f.key === fieldKey)) return sec.key;
  }
  return undefined;
}

function fieldLabel(fieldKey: string): string {
  for (const sec of getSellerDeclarationSections()) {
    const f = sec.fields.find((x) => x.key === fieldKey);
    if (f) return f.label;
  }
  return fieldKey;
}

/**
 * Weighted 0–100: baseline 100, then penalties (no double-count for mandatory vs incomplete).
 */
export function computeCaseHealthScore(args: {
  hasContradiction: boolean;
  hasMandatoryGap: boolean;
  signatureNotReady: boolean;
  incompleteOptionalOnly: boolean;
}): number {
  let score = 100;
  if (args.hasContradiction) score -= 40;
  if (args.hasMandatoryGap) score -= 30;
  if (args.signatureNotReady) score -= 20;
  if (args.incompleteOptionalOnly) score -= 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function dedupeLabels(items: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

function buildWarningItems(
  graphWarnings: string[],
  deps: string[],
  valWarnings: string[],
  ruleWarnings: string[],
): CaseHealthBlockerItem[] {
  const labels = dedupeLabels(
    [
      ...graphWarnings,
      ...deps.map((m) => `Dependency: ${m}`),
      ...valWarnings,
      ...ruleWarnings,
    ],
    MAX_ITEMS * 2,
  );
  return labels.slice(0, MAX_ITEMS).map((label, i) => ({
    id: `w-${i}`,
    label: label.length > 140 ? `${label.slice(0, 137)}…` : label,
  }));
}

function buildBlockerItems(args: {
  contradictionFlags: string[];
  missingFieldKeys: string[];
  knowledgeBlocks: string[];
  graphBlockers: string[];
}): CaseHealthBlockerItem[] {
  const out: CaseHealthBlockerItem[] = [];
  let i = 0;
  for (const c of args.contradictionFlags) {
    if (out.length >= MAX_ITEMS) break;
    out.push({ id: `c-${i++}`, label: `Contradiction: ${c}` });
  }
  for (const m of args.missingFieldKeys) {
    if (out.length >= MAX_ITEMS) break;
    out.push({
      id: `m-${i++}`,
      label: fieldLabel(m),
      sectionKey: sectionKeyForFieldKey(m),
    });
  }
  for (const b of args.knowledgeBlocks) {
    if (out.length >= MAX_ITEMS) break;
    out.push({ id: `k-${i++}`, label: b });
  }
  for (const g of args.graphBlockers) {
    if (out.length >= MAX_ITEMS) break;
    out.push({ id: `g-${i++}`, label: g });
  }
  return out;
}

export async function getCaseHealthSnapshot(documentId: string, actorUserId?: string): Promise<CaseHealthSnapshot | null> {
  const [legal, draft] = await Promise.all([
    getCaseLegalSummary(documentId, actorUserId),
    prisma.sellerDeclarationDraft.findUnique({
      where: { id: documentId },
      select: {
        listingId: true,
        status: true,
        draftPayload: true,
      },
    }),
  ]);

  if (!legal || !draft) return null;

  const listingRow = await prisma.fsboListing.findUnique({
    where: { id: draft.listingId },
    select: { title: true, address: true, city: true, priceCents: true },
  });
  if (!listingRow) return null;

  const payload = (draft.draftPayload ?? {}) as Record<string, unknown>;
  const v = runDeclarationValidationDeterministic(payload);
  const rules = evaluateDeclarationKnowledgeRules(payload);
  const graph = legal.summary;

  let negotiationSummary: CaseNegotiationSummary | null = null;
  let negotiationBlocksSignature = false;
  try {
    const snap = await getNegotiationSnapshotForCase(draft.listingId, documentId);
    if (snap.chain) {
      const av = snap.activeVersion;
      negotiationBlocksSignature = !av || av.status !== "accepted" || !av.isFinal;
      const diffSummaryLines = snap.diffFromPrevious ? formatNegotiationDiffSummary(snap.diffFromPrevious) : [];
      negotiationSummary = {
        chainStatus: snap.chain.status,
        activeVersionNumber: av?.versionNumber ?? null,
        activeVersionStatus: av?.status ?? null,
        activeIsFinal: av?.isFinal ?? false,
        previousVersionNumber: snap.previousVersion?.versionNumber ?? null,
        diffSummaryLines,
        nextAction: negotiationBlocksSignature
          ? "Accept the current negotiation version (or resolve counters) before signing or relying on price/terms."
          : "Negotiation terms are final on file for this snapshot.",
      };
    }
  } catch {
    negotiationSummary = null;
  }

  const hasMandatoryGap = v.missingFields.length > 0 || rules.blocks.length > 0;
  const hasContradiction = v.contradictionFlags.length > 0;
  const signatureNotReady = !graph.signatureReadiness.ready || negotiationBlocksSignature;
  const incompleteOptionalOnly =
    !hasMandatoryGap && v.completenessPercent < 100 && v.missingFields.length === 0 && rules.blocks.length === 0;

  const score = computeCaseHealthScore({
    hasContradiction,
    hasMandatoryGap,
    signatureNotReady,
    incompleteOptionalOnly,
  });

  let status: CaseHealthStatus = "ready";
  if (hasContradiction || graph.fileHealth === "critical" || score < 40) status = "critical";
  else if (graph.fileHealth === "blocked" || graph.blockingIssues.length > 0 || score < 70 || draft.status === "needs_changes") {
    status = "attention";
  }

  let blockers = buildBlockerItems({
    contradictionFlags: v.contradictionFlags,
    missingFieldKeys: v.missingFields,
    knowledgeBlocks: rules.blocks,
    graphBlockers: graph.blockingIssues,
  });
  if (negotiationBlocksSignature) {
    blockers = [
      {
        id: "negotiation-non-final",
        label: "Negotiation: active offer version is not final — accept a version before signing or binding steps.",
      },
      ...blockers,
    ].slice(0, MAX_ITEMS);
  }
  const negWarnings: string[] = [];
  if (negotiationBlocksSignature) {
    negWarnings.push("Negotiation chain has a non-final active version — terms are not settled.");
  }
  const warnings = buildWarningItems(graph.warnings, graph.missingDependencies, [...negWarnings, ...v.warningFlags], rules.warnings);

  const declarationsComplete = !hasMandatoryGap;
  const noContradictions = !hasContradiction;
  const approvalsDone = draft.status === "approved";
  const requiredFieldsFilled = v.missingFields.length === 0;

  const checklist = [
    { id: "decl", label: "Declarations complete (no mandatory gaps)", done: declarationsComplete },
    { id: "contra", label: "No contradictions", done: noContradictions },
    { id: "appr", label: "Review / approval complete", done: approvalsDone },
    { id: "req", label: "All required fields filled", done: requiredFieldsFilled },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  let sigStatus: CaseSignatureReadinessStatus = "not_ready";
  if (negotiationBlocksSignature) sigStatus = "not_ready";
  else if (doneCount === 4) sigStatus = "ready";
  else if (doneCount === 3) sigStatus = "almost_ready";

  const primaryNextAction = (() => {
    if (negotiationBlocksSignature) return "Finalize negotiation — accept the current offer version before signing or relying on price/terms.";
    if (hasContradiction) return "Resolve declaration contradictions — open the declaration and align answers.";
    if (hasMandatoryGap) return "Complete mandatory declaration fields and disclosure rules.";
    if (graph.blockingIssues.length) return "Clear legal graph blockers before signing.";
    if (signatureNotReady) return "Address signature readiness items on the legal file.";
    if (draft.status === "in_review") return "Assign or complete human review — no auto-approval.";
    if (draft.status === "needs_changes") return "Apply requested changes and resubmit for review.";
    return "Case is in good shape — continue monitoring.";
  })();

  const pool = [
    graph.blockingIssues.length ? "Review blocking issues in the legal graph." : null,
    graph.missingDependencies.length ? "Resolve missing graph dependencies." : null,
    !approvalsDone && draft.status !== "draft" ? "Track review status until approval." : null,
    rules.warnings.length ? "Review knowledge-base warnings." : null,
  ].filter(Boolean) as string[];

  const secondaryActions = dedupeLabels(
    pool.filter((a) => a !== primaryNextAction),
    3,
  );

  const contract = await prisma.contract.findFirst({
    where: { fsboListingId: draft.listingId },
    orderBy: { updatedAt: "desc" },
    select: { status: true, signed: true },
  });

  let contractState: CaseHealthSnapshot["documentPanels"]["contract"] = "incomplete";
  if (contract) {
    if (contract.signed || contract.status === "completed" || contract.status === "signed") contractState = "complete";
    else if (contract.status === "cancelled") contractState = "blocked";
    else contractState = "incomplete";
  }

  let sellerState: CaseHealthSnapshot["documentPanels"]["sellerDeclaration"] = "incomplete";
  if (hasContradiction || hasMandatoryGap || graph.blockingIssues.length) sellerState = "blocked";
  else if (draft.status === "approved" && v.isValid) sellerState = "complete";
  else sellerState = "incomplete";

  let reviewState: CaseHealthSnapshot["documentPanels"]["review"] = "incomplete";
  if (draft.status === "approved") reviewState = "complete";
  else if (draft.status === "needs_changes") reviewState = "blocked";
  else reviewState = "incomplete";

  const propertyAddressLine = [listingRow.address, listingRow.city].filter(Boolean).join(", ");

  return {
    documentId,
    propertyId: draft.listingId,
    listPriceCents: listingRow.priceCents,
    propertyTitle: listingRow.title,
    propertyAddressLine,
    score,
    status,
    blockers,
    warnings,
    primaryNextAction,
    secondaryActions,
    signatureReadiness: { status: sigStatus, checklist },
    documentPanels: {
      sellerDeclaration: sellerState,
      contract: contractState,
      review: reviewState,
    },
    legalSummary: graph,
    knowledgeRules: rules,
    negotiation: negotiationSummary,
  };
}
