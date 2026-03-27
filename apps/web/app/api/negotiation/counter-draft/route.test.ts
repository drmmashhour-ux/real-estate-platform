import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/negotiation/counter-draft/route";
import { DraftConfidence } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.enums";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/app/api/negotiation/_access", () => ({
  assertNegotiationDraftAccess: vi.fn(),
}));

vi.mock("@/src/modules/ai-negotiation-deal-intelligence/application/generateCounterProposalDraft", () => ({
  generateCounterProposalDraft: vi.fn(),
}));

vi.mock("@/lib/analytics/posthog-server", () => ({
  captureServerEvent: vi.fn(),
}));

describe("POST /api/negotiation/counter-draft", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 400 without propertyId", async () => {
    const res = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({}) }));
    expect(res.status).toBe(400);
  });

  it("returns draft with dispatch none", async () => {
    const { assertNegotiationDraftAccess } = await import("@/app/api/negotiation/_access");
    const { generateCounterProposalDraft } = await import(
      "@/src/modules/ai-negotiation-deal-intelligence/application/generateCounterProposalDraft"
    );
    vi.mocked(assertNegotiationDraftAccess).mockResolvedValue({ ok: true, userId: "user-1" });
    vi.mocked(generateCounterProposalDraft).mockResolvedValue({
      summary: "x",
      requestedChanges: [],
      protections: ["p"],
      rationale: "y",
      followUpRequests: [],
      missingFacts: [],
      confidence: DraftConfidence.High,
      sourceRefs: [],
      disclaimer: "z",
    });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ propertyId: "lst-1" }),
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { dispatch: string };
    expect(json.dispatch).toBe("none");
  });
});
