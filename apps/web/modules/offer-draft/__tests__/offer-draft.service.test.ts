import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    offerDraft: { findFirst: vi.fn(), update: vi.fn() },
    lecipmLegalDocumentArtifact: { findUnique: vi.fn() },
  },
}));

vi.mock("@/modules/legal-documents", () => ({
  dispatchLegalDocumentArtifact: vi.fn(),
  legalDocumentsEngineEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/signature-control/action-pipeline-guard", () => ({
  assertOfferSendSignatureGate: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import { dispatchLegalDocumentArtifact } from "@/modules/legal-documents";
import { sendApprovedOfferDraft } from "../offer-draft.service";

describe("sendApprovedOfferDraft", () => {
  beforeEach(() => {
    vi.mocked(prisma.offerDraft.findFirst).mockReset();
    vi.mocked(prisma.offerDraft.update).mockReset();
    vi.mocked(prisma.lecipmLegalDocumentArtifact.findUnique).mockReset();
    vi.mocked(dispatchLegalDocumentArtifact).mockReset();
  });

  it("blocks send when promise artifact is not broker-approved", async () => {
    vi.mocked(prisma.offerDraft.findFirst).mockResolvedValue({
      id: "od1",
      dealId: "d1",
      status: "APPROVED",
      promiseArtifactId: "art1",
    } as never);
    vi.mocked(prisma.lecipmLegalDocumentArtifact.findUnique).mockResolvedValue({
      id: "art1",
      status: "AWAITING_APPROVAL",
    } as never);

    await expect(
      sendApprovedOfferDraft({
        dealId: "d1",
        draftId: "od1",
        brokerUserId: "b1",
        role: "BROKER",
        channel: "EMAIL",
      }),
    ).rejects.toThrow(/PROMISE_ARTIFACT_NOT_APPROVED/);
    expect(dispatchLegalDocumentArtifact).not.toHaveBeenCalled();
  });
});
