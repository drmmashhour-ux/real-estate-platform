import type {
  CounterProposalDraftOutput,
  DraftSourceRef,
  GroundedNegotiationDraftContext,
  NegotiationMessageDraftOutput,
  NegotiationMessageDraftType,
} from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.types";
import {
  appendPolicyFooter,
  blockersFavorClarification,
  computeDraftConfidence,
  uncertaintyPreamble,
} from "@/src/modules/ai-negotiation-deal-intelligence/infrastructure/negotiationDraftPolicyService";

const DISCLAIMER =
  "Draft for human review only. Not legal advice, not an offer, not acceptance. No automatic sending. Edit before use.";

function buildSourceRefs(ctx: GroundedNegotiationDraftContext): DraftSourceRef[] {
  const refs: DraftSourceRef[] = [
    {
      id: "listing.core",
      label: "Listing (database)",
      detail: ctx.listPriceFormatted ? `Price on file: ${ctx.listPriceFormatted}` : "Price not available on listing row",
    },
    {
      id: "declaration.validation",
      label: "Seller declaration validation",
      detail: `${ctx.completenessPercent}% complete; ${ctx.missingFieldLabels.length} required field(s) open`,
    },
    {
      id: "legal_graph",
      label: "Legal intelligence graph",
      detail:
        ctx.blockingLabels.length || ctx.warningLabels.length
          ? `${ctx.blockingLabels.length} blocker(s), ${ctx.warningLabels.length} warning line(s)`
          : "No open blockers in graph summary",
    },
  ];
  if (ctx.riskScore != null || ctx.trustScore != null) {
    refs.push({
      id: "listing.scores",
      label: "Listing risk / trust scores (platform)",
      detail: `risk=${ctx.riskScore ?? "n/a"}, trust=${ctx.trustScore ?? "n/a"}`,
    });
  }
  if (ctx.negotiationPlan?.recommendedStrategy) {
    refs.push({
      id: "negotiation_plan",
      label: "Negotiation plan (client-supplied snapshot)",
      detail: ctx.negotiationPlan.recommendedStrategy.slice(0, 200),
    });
  }
  if (ctx.knowledgeSnippet && ctx.knowledgeSourceTitle) {
    refs.push({
      id: "knowledge.retrieval",
      label: `Knowledge base: ${ctx.knowledgeSourceTitle}`,
      detail: "Excerpt used for phrasing tone only — facts come from listing/declaration above",
    });
  }
  if (ctx.activeNegotiationVersion) {
    const v = ctx.activeNegotiationVersion;
    const priceStr = v.priceCents != null ? `$${(v.priceCents / 100).toLocaleString()}` : "n/a";
    const depStr = v.depositCents != null ? `$${(v.depositCents / 100).toLocaleString()}` : "n/a";
    const diffBit =
      v.diffSummaryLines.length > 0 ? ` Changes vs prior: ${v.diffSummaryLines.slice(0, 4).join("; ")}.` : "";
    refs.push({
      id: "negotiation_chain.active",
      label: `Negotiation chain v${v.versionNumber} (${v.status})${v.isFinal ? ", final" : ""}`,
      detail: `${v.termsNotFinal ? "TERMS NOT FINAL — " : ""}Price ${priceStr}; deposit ${depStr}.${diffBit} Source: active negotiation snapshot (LECIPM).`,
    });
  }
  return refs;
}

function missingFactsList(ctx: GroundedNegotiationDraftContext): string[] {
  const out: string[] = [];
  for (const m of ctx.missingFieldLabels.slice(0, 12)) out.push(`Disclosure field: ${m}`);
  if (!ctx.listPriceFormatted) out.push("List price not available on the listing record used for this draft.");
  if (ctx.documentId == null) out.push("No seller declaration draft matched this listing.");
  return out;
}

export function buildCounterProposalDraftOutput(ctx: GroundedNegotiationDraftContext): CounterProposalDraftOutput {
  const confidence = computeDraftConfidence(ctx);
  const sourceRefs = buildSourceRefs(ctx);
  const clarifyFirst = blockersFavorClarification(ctx);

  const priceLine = ctx.listPriceFormatted
    ? `The listing shows an asking price of ${ctx.listPriceFormatted} (from the listing record).`
    : "List price was not available on the listing record — confirm price outside this draft.";

  let summary = [
    `Property: ${ctx.listingTitle} (${ctx.city}).`,
    priceLine,
    clarifyFirst
      ? "Open items remain on the file; this draft favors clarification and conditional terms rather than aggressive positions."
      : "File checks show fewer mandatory gaps; still verify all facts independently.",
  ].join(" ");

  const up = uncertaintyPreamble(confidence);
  if (up) summary = `${summary}\n\n${up}`;

  if (ctx.negotiationPlan?.readinessToProceed) {
    summary += `\n\nPlan note (from supplied snapshot): ${ctx.negotiationPlan.readinessToProceed}`;
  }

  const requestedChanges: string[] = [];
  if (ctx.desiredChanges.length) {
    requestedChanges.push(...ctx.desiredChanges.map((d) => `Requested by user: ${d}`));
  }
  if (ctx.missingFieldLabels.length) {
    requestedChanges.push(`Address disclosure gaps: ${ctx.missingFieldLabels.slice(0, 8).join("; ")}.`);
  }
  if (ctx.contradictionSummaries.length) {
    requestedChanges.push(`Reconcile inconsistencies flagged by validation: ${ctx.contradictionSummaries.slice(0, 5).join("; ")}.`);
  }
  if (ctx.blockingLabels.length) {
    requestedChanges.push(`Resolve file readiness items: ${ctx.blockingLabels.slice(0, 5).join("; ")}.`);
  }
  if (!requestedChanges.length) {
    requestedChanges.push("Align inspection window, financing condition, and closing timeline with your client’s instructions (edit as needed).");
  }

  const protections: string[] = [
    "Financing condition — dates and lender conditions to be filled by your professional.",
    "Inspection / review period appropriate to property type — not a substitute for a professional inspection.",
    "Agreement remains conditional until declarations and documents meet your firm’s standard.",
  ];
  if (ctx.negotiationPlan?.protectionsToInclude?.length) {
    protections.push(...ctx.negotiationPlan.protectionsToInclude.map((p) => `From plan snapshot: ${p}`));
  }
  if (ctx.signatureReady === false) {
    protections.unshift("Signatures / documents not ready per platform checks — keep terms conditional until cleared.");
  }

  const followUpRequests: string[] = [];
  if (ctx.missingFieldLabels.length) {
    followUpRequests.push(`Obtain or confirm: ${ctx.missingFieldLabels.slice(0, 6).join("; ")}.`);
  }
  if (ctx.blockingLabels.length) {
    followUpRequests.push(`Follow up on file items: ${ctx.blockingLabels.slice(0, 4).join("; ")}.`);
  }

  const rationale = [
    `Declaration status (system): ${ctx.declarationStatus ?? "none"}.`,
    `Completeness (validation): ${ctx.completenessPercent}%.`,
    `Contradictions (validation): ${ctx.contradictionSummaries.length}.`,
    `Graph blockers: ${ctx.blockingLabels.length}.`,
    ctx.knowledgeSnippet ? "Knowledge excerpt was used for wording tone only, not for new facts." : "No knowledge-base excerpt attached.",
  ].join(" ");

  return {
    summary,
    requestedChanges,
    protections,
    rationale,
    followUpRequests,
    missingFacts: missingFactsList(ctx),
    confidence,
    sourceRefs,
    disclaimer: DISCLAIMER,
  };
}

export function buildNegotiationMessageDraftOutput(
  draftType: NegotiationMessageDraftType,
  ctx: GroundedNegotiationDraftContext,
): NegotiationMessageDraftOutput {
  const confidence = computeDraftConfidence(ctx);
  const sourceRefs = buildSourceRefs(ctx);
  const propertyLine = `${ctx.listingTitle} — ${ctx.city}`;
  const issues = [...ctx.blockingLabels, ...ctx.warningLabels].filter(Boolean).slice(0, 6);
  const missing = ctx.missingFieldLabels.slice(0, 8);
  const clarifyFirst = blockersFavorClarification(ctx);

  let subject: string | undefined;
  let message = "";
  const keyPoints: string[] = [];
  const assumptions: string[] = [
    "Draft uses only listing, declaration validation, and legal graph summaries available to the platform.",
    "No timeline or price outcome is promised.",
  ];
  if (ctx.userContext.strategyMode) assumptions.push(`Strategy mode hint: ${ctx.userContext.strategyMode}`);

  switch (draftType) {
    case "seller_clarification_request":
      subject = `Clarifications — ${propertyLine}`;
      message = [
        "Hello,",
        "",
        `We are reviewing ${propertyLine}.`,
        clarifyFirst ? "We need a few clarifications before proceeding; open items remain on the file." : "We have a short list of follow-ups.",
        missing.length ? `Items tied to the disclosure: ${missing.join("; ")}.` : "",
        issues.length ? `Additional notes from our review: ${issues.join("; ")}.` : "",
        "",
        "Thank you,",
      ]
        .filter(Boolean)
        .join("\n");
      keyPoints.push("Request information only — no commitment implied.");
      break;
    case "buyer_guidance_note":
      subject = `Discussion notes — ${propertyLine}`;
      message = [
        "Guidance for discussion (not legal advice):",
        "",
        `- Property: ${propertyLine}`,
        ctx.listPriceFormatted ? `- List price on file: ${ctx.listPriceFormatted}` : "- List price: not on file in this draft",
        missing.length ? `- Open disclosure items: ${missing.join("; ")}` : "- No mandatory gaps flagged by platform checks",
        ctx.contradictionSummaries.length ? `- Validation flags: ${ctx.contradictionSummaries.slice(0, 3).join("; ")}` : "",
        "",
        "Review with your broker or lawyer before any decision.",
      ]
        .filter(Boolean)
        .join("\n");
      keyPoints.push("Uses file data only; verify independently.");
      break;
    case "broker_internal_summary":
      subject = `Internal — ${propertyLine}`;
      message = [
        "Internal — do not send as-is",
        "",
        `Listing: ${propertyLine}`,
        `Declaration id: ${ctx.documentId ?? "none"}`,
        `Status: ${ctx.declarationStatus ?? "n/a"}`,
        `Completeness: ${ctx.completenessPercent}%`,
        `Risk/trust (listing): ${ctx.riskScore ?? "n/a"} / ${ctx.trustScore ?? "n/a"}`,
        `Blockers (graph): ${ctx.blockingLabels.length ? ctx.blockingLabels.slice(0, 5).join("; ") : "none"}`,
        `Contradictions: ${ctx.contradictionSummaries.length ? ctx.contradictionSummaries.join("; ") : "none"}`,
        `Signature readiness: ${ctx.signatureReady == null ? "unknown" : ctx.signatureReady ? "ready" : "not ready"}`,
      ].join("\n");
      keyPoints.push("For brokerage file — redact before client-facing use.");
      break;
    case "needs_more_documents_request":
      subject = `Documents — ${propertyLine}`;
      message = [
        "Hello,",
        "",
        `Regarding ${propertyLine}, additional documents or completed fields are needed before we proceed.`,
        missing.length ? `Items: ${missing.join("; ")}.` : "Please upload outstanding items referenced in the file.",
        issues.length ? `Notes: ${issues.join("; ")}.` : "",
        "",
        "Thank you,",
      ]
        .filter(Boolean)
        .join("\n");
      keyPoints.push("Non-binding request for documents only.");
      break;
    case "inspection_recommended_message":
      subject = `Inspection — ${propertyLine}`;
      message = [
        `Regarding ${propertyLine}, we recommend a professional inspection before firming purchase terms.`,
        ctx.warningLabels.length ? `Related notes on file: ${ctx.warningLabels.slice(0, 4).join("; ")}.` : "",
        "",
        "This is a process suggestion — not a substitute for a qualified inspector.",
      ]
        .filter(Boolean)
        .join("\n");
      keyPoints.push("Inspection recommendation — not a guarantee of findings.");
      break;
    case "document_review_recommended_message":
      subject = `Document review — ${propertyLine}`;
      message = [
        `Regarding ${propertyLine}, we recommend completing document review (title-related and declaration items) before firming.`,
        ctx.blockingLabels.length ? `Open file items: ${ctx.blockingLabels.slice(0, 5).join("; ")}.` : "",
        "",
        "Review timelines with your legal representative.",
      ]
        .filter(Boolean)
        .join("\n");
      keyPoints.push("Emphasize review — not approval of legal title.");
      break;
    default:
      subject = `Follow-up — ${propertyLine}`;
      message = `Regarding ${propertyLine}, please review current file status with your representative.`;
  }

  message = appendPolicyFooter(message, confidence);

  return {
    draftType,
    subject,
    message,
    keyPoints,
    assumptions,
    missingFacts: missingFactsList(ctx),
    confidence,
    sourceRefs,
    disclaimer: DISCLAIMER,
  };
}

