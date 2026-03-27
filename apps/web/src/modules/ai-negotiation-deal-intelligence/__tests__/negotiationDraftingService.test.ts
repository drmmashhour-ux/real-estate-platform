import { describe, expect, it } from "vitest";
import {
  buildCounterProposalDraftOutput,
  buildNegotiationMessageDraftOutput,
} from "@/src/modules/ai-negotiation-deal-intelligence/infrastructure/negotiationDraftingService";
import type { GroundedNegotiationDraftContext } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.types";
import { DraftConfidence } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.enums";
import { computeDraftConfidence, blockersFavorClarification } from "@/src/modules/ai-negotiation-deal-intelligence/infrastructure/negotiationDraftPolicyService";

const baseCtx = (): GroundedNegotiationDraftContext => ({
  listingId: "l1",
  documentId: "d1",
  listingTitle: "123 Main",
  city: "Montreal",
  listPriceFormatted: "$500,000",
  declarationStatus: "draft",
  missingFieldLabels: ["Year built"],
  blockingLabels: ["Review declaration"],
  warningLabels: ["Check roof"],
  contradictionSummaries: [],
  signatureReady: false,
  completenessPercent: 85,
  riskScore: 20,
  trustScore: 80,
  negotiationPlan: null,
  desiredChanges: [],
  userContext: {},
  knowledgeSnippet: null,
  knowledgeSourceTitle: null,
});

describe("negotiationDraftingService", () => {
  it("counter draft reflects listing title and structured fields", () => {
    const d = buildCounterProposalDraftOutput(baseCtx());
    expect(d.summary).toContain("123 Main");
    expect(d.requestedChanges.some((x) => x.includes("Year built"))).toBe(true);
    expect(d.protections.length).toBeGreaterThan(0);
    expect(d.sourceRefs.some((r) => r.id === "listing.core")).toBe(true);
    expect(d.disclaimer.toLowerCase()).toContain("review");
  });

  it("message draft stays factual — no invented comparable prices", () => {
    const m = buildNegotiationMessageDraftOutput("buyer_guidance_note", baseCtx());
    expect(m.message).toContain("123 Main");
    expect(m.message).toContain("$500,000");
    expect(m.message.toLowerCase()).not.toContain("guarantee");
    expect(m.keyPoints.length).toBeGreaterThan(0);
  });

  it("blockers lower confidence and favor clarification tone", () => {
    const ctx = baseCtx();
    ctx.blockingLabels = ["Block A"];
    expect(computeDraftConfidence(ctx)).toBe(DraftConfidence.Low);
    expect(blockersFavorClarification(ctx)).toBe(true);
    const d = buildCounterProposalDraftOutput(ctx);
    expect(d.summary.toLowerCase()).toMatch(/clarif|conditional|open/i);
  });

  it("low missing-field volume can yield higher confidence when no blockers", () => {
    const ctx = baseCtx();
    ctx.blockingLabels = [];
    ctx.missingFieldLabels = [];
    ctx.contradictionSummaries = [];
    ctx.completenessPercent = 100;
    ctx.warningLabels = [];
    expect(computeDraftConfidence(ctx)).toBe(DraftConfidence.High);
  });
});
