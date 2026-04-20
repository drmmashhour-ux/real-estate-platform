import { describe, expect, it, vi, beforeEach } from "vitest";
import { validateLegalHubBuffer } from "../legal-hub-mime-sniff";
import { LEGAL_HUB_DOCUMENT_STATUS, LEGAL_HUB_REVIEW_DECISION } from "../legal-hub-phase2.constants";
import { validateWorkflowBeforeSubmit } from "../legal-workflow-submission.service";
import { reviewDocument } from "../legal-review.service";
import { PlatformRole } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    legalHubSubmissionDocument: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    legalWorkflowSubmission: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    legalAuditLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("Legal Hub Phase 2 unit guards", () => {
  beforeEach(() => {
    vi.mocked(prisma.legalHubSubmissionDocument.findFirst).mockReset();
    vi.mocked(prisma.legalHubSubmissionDocument.findUnique).mockReset();
    vi.mocked(prisma.legalHubSubmissionDocument.update).mockReset();
    vi.mocked(prisma.legalAuditLog.create).mockReset();
  });

  it("validateLegalHubBuffer rejects JPEG declared as PNG", async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const r = validateLegalHubBuffer({
      buffer: jpeg,
      declaredMime: "image/png",
    });
    expect(r.ok).toBe(false);
  });

  it("validateWorkflowBeforeSubmit fails when requirements lack documents", async () => {
    vi.mocked(prisma.legalHubSubmissionDocument.findFirst).mockResolvedValue(null);

    const r = await validateWorkflowBeforeSubmit({
      userId: "u1",
      actorType: "seller",
      workflowType: "seller_disclosure",
    });

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.missingRequirementIds?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("reviewDocument rejects without reason", async () => {
    vi.mocked(prisma.legalHubSubmissionDocument.findUnique).mockResolvedValue({
      id: "d1",
      userId: "u1",
      actorType: "seller",
      workflowType: "seller_disclosure",
      requirementId: "accuracy_ack",
      workflowSubmissionId: null,
      fileUrl: "path",
      fileName: "x.pdf",
      fileType: "application/pdf",
      status: LEGAL_HUB_DOCUMENT_STATUS.SUBMITTED,
      uploadedAt: new Date(),
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const r = await reviewDocument({
      reviewerUserId: "rev1",
      reviewerRole: PlatformRole.ADMIN,
      documentId: "d1",
      decision: LEGAL_HUB_REVIEW_DECISION.REJECT,
      reason: "   ",
    });

    expect(r.ok).toBe(false);
    expect(prisma.legalHubSubmissionDocument.update).not.toHaveBeenCalled();
  });
});
