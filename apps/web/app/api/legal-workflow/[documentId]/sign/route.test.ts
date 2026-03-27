import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/app/api/legal-workflow/_auth", () => ({ requireDocumentAccess: vi.fn() }));
vi.mock("@/src/modules/negotiation-chain-engine/application/negotiationSignatureGuard", () => ({
  assertNegotiationSignatureAllowed: vi.fn(),
}));
vi.mock("@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository", () => ({
  createAuditLog: vi.fn(),
  createSignatureReadiness: vi.fn(),
  getDocumentById: vi.fn(),
}));
vi.mock("@/src/modules/legal-workflow/application/updateDocumentStatus", () => ({ updateDocumentStatus: vi.fn() }));
vi.mock("@/lib/analytics/posthog-server", () => ({ captureServerEvent: vi.fn() }));

import { assertNegotiationSignatureAllowed } from "@/src/modules/negotiation-chain-engine/application/negotiationSignatureGuard";

import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { createSignatureReadiness, getDocumentById } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";

describe("POST /api/legal-workflow/[documentId]/sign", () => {
  it("enforces access", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: false, status: 403 } as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ signerName: "a", signerEmail: "b@x.com" }) }) as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(403);
  });

  it("blocks negotiation gate", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: true, status: 200, userId: "u1", isAdmin: true } as never);
    vi.mocked(assertNegotiationSignatureAllowed).mockResolvedValue({
      ok: false,
      status: 409,
      message: "negotiation not final",
    } as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ signerName: "Client", signerEmail: "c@x.com" }) }) as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(409);
  });

  it("creates signature entry", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: true, status: 200, userId: "u1", isAdmin: true } as never);
    vi.mocked(assertNegotiationSignatureAllowed).mockResolvedValue({ ok: true, negotiationVersionId: "nv1" } as never);
    vi.mocked(createSignatureReadiness).mockResolvedValue({ id: "s1" } as never);
    vi.mocked(getDocumentById).mockResolvedValue({ status: "finalized" } as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ signerName: "Client", signerEmail: "c@x.com" }) }) as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(200);
    expect(vi.mocked(createSignatureReadiness)).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: "d1", negotiationVersionId: "nv1" }),
    );
  });
});
