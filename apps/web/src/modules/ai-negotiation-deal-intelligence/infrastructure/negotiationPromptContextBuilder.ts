import { prisma } from "@/lib/db";
import { getLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/application/getLegalGraphSummary";
import { getLegalContext } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";
import { fieldLabelFromKey } from "@/src/modules/ai-negotiation-deal-intelligence/infrastructure/negotiationDraftFieldLabels";
import {
  formatNegotiationDiffSummary,
  getNegotiationSnapshotForCase,
} from "@/src/modules/negotiation-chain-engine/application/negotiationSnapshot";
import type {
  GroundedNegotiationDraftContext,
  NegotiationPlanSnapshot,
} from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.types";

function formatMoneyCents(cents: number | null | undefined): string | null {
  if (cents == null || cents <= 0) return null;
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/**
 * Assembles a single grounded context object from listing, declaration, graph, validation, and optional plan.
 * Does not invent facts; optional knowledge retrieval returns excerpt + title only when chunks exist.
 */
export async function buildGroundedNegotiationDraftContext(args: {
  propertyId: string;
  documentId?: string | null;
  negotiationPlan?: NegotiationPlanSnapshot | null;
  desiredChanges?: string[];
  userContext?: { role?: string; strategyMode?: string };
}): Promise<GroundedNegotiationDraftContext | null> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: args.propertyId },
    select: {
      id: true,
      title: true,
      city: true,
      priceCents: true,
      riskScore: true,
      trustScore: true,
    },
  });
  if (!listing) return null;

  const draft =
    args.documentId != null
      ? await prisma.sellerDeclarationDraft.findFirst({
          where: { id: args.documentId, listingId: args.propertyId },
          select: { id: true, status: true, draftPayload: true },
        })
      : await prisma.sellerDeclarationDraft.findFirst({
          where: { listingId: args.propertyId },
          orderBy: { updatedAt: "desc" },
          select: { id: true, status: true, draftPayload: true },
        });

  const payload = (draft?.draftPayload ?? {}) as Record<string, unknown>;
  const validation = runDeclarationValidationDeterministic(payload);
  const missingFieldLabels = validation.missingFields.map((k) => fieldLabelFromKey(k));

  let graph;
  try {
    graph = await getLegalGraphSummary(args.propertyId);
  } catch {
    graph = null;
  }

  const blockingLabels = graph?.blockingIssues ?? [];
  const contradictionSummaries = validation.contradictionFlags.slice(0, 8);

  let knowledgeSnippet: string | null = null;
  let knowledgeSourceTitle: string | null = null;
  try {
    const q = `seller disclosure negotiation ${listing.city} ${listing.title}`.slice(0, 200);
    const hits = await getLegalContext(q, { audience: "seller", documentType: "drafting", limit: 1 }).catch(() => []);
    const h = hits[0];
    if (h?.content) {
      knowledgeSnippet = h.content.length > 400 ? `${h.content.slice(0, 397)}…` : h.content;
      knowledgeSourceTitle = h.source.title;
    }
  } catch {
    /* optional */
  }

  let activeNegotiationVersion: GroundedNegotiationDraftContext["activeNegotiationVersion"] = null;
  try {
    const snap = await getNegotiationSnapshotForCase(args.propertyId, args.documentId ?? null);
    const av = snap.activeVersion;
    if (av?.terms) {
      const t = av.terms;
      const diffSummaryLines = snap.diffFromPrevious ? formatNegotiationDiffSummary(snap.diffFromPrevious) : [];
      activeNegotiationVersion = {
        chainId: snap.chain?.id ?? null,
        versionNumber: av.versionNumber,
        status: av.status,
        isFinal: av.isFinal,
        priceCents: t.priceCents,
        depositCents: t.depositCents,
        financingTerms: t.financingTerms,
        commissionTerms: t.commissionTerms,
        deadlines: t.deadlines,
        clauseTypesActive: av.clauses.filter((c) => !c.removed).map((c) => c.clauseType),
        diffSummaryLines,
        termsNotFinal: av.status !== "accepted" || !av.isFinal,
      };
    }
  } catch {
    activeNegotiationVersion = null;
  }

  const extraNegotiationWarnings: string[] = [];
  if (activeNegotiationVersion?.termsNotFinal) {
    extraNegotiationWarnings.push(
      "Negotiation: active version is not final — do not treat price, deposit, or terms as settled until accepted.",
    );
  }

  const warningLabels = [...extraNegotiationWarnings, ...(graph?.warnings ?? []), ...validation.warningFlags].slice(0, 14);

  return {
    listingId: listing.id,
    documentId: draft?.id ?? null,
    listingTitle: listing.title,
    city: listing.city,
    listPriceFormatted: formatMoneyCents(listing.priceCents),
    declarationStatus: draft?.status ?? null,
    missingFieldLabels,
    blockingLabels,
    warningLabels,
    contradictionSummaries,
    signatureReady: graph?.signatureReadiness?.ready ?? null,
    completenessPercent: validation.completenessPercent ?? 0,
    riskScore: listing.riskScore ?? null,
    trustScore: listing.trustScore ?? null,
    negotiationPlan: args.negotiationPlan ?? null,
    desiredChanges: Array.isArray(args.desiredChanges) ? args.desiredChanges.filter((x) => typeof x === "string" && x.trim()) : [],
    userContext: args.userContext ?? {},
    knowledgeSnippet,
    knowledgeSourceTitle,
    activeNegotiationVersion,
  };
}
