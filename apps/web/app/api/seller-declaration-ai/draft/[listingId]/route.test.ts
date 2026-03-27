import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/app/api/seller-declaration-ai/_auth", () => ({ requireSellerOrAdminForListing: vi.fn() }));
vi.mock("@/src/modules/seller-declaration-ai/application/getDeclarationDraft", () => ({ getDeclarationDraft: vi.fn() }));

import { requireSellerOrAdminForListing } from "@/app/api/seller-declaration-ai/_auth";
import { getDeclarationDraft } from "@/src/modules/seller-declaration-ai/application/getDeclarationDraft";

describe("GET /api/seller-declaration-ai/draft/[listingId]", () => {
  it("enforces auth/role checks", async () => {
    vi.mocked(requireSellerOrAdminForListing).mockResolvedValue({ ok: false, status: 403, userId: null, isAdmin: false } as never);
    const res = await GET(new Request("http://x") as never, { params: Promise.resolve({ listingId: "l1" }) } as never);
    expect(res.status).toBe(403);
  });

  it("returns sanitized draft payload", async () => {
    vi.mocked(requireSellerOrAdminForListing).mockResolvedValue({ ok: true, status: 200, userId: "u1", isAdmin: true } as never);
    vi.mocked(getDeclarationDraft).mockResolvedValue({ id: "d1", listingId: "l1", status: "draft", draftPayload: {}, validationSummary: null, updatedAt: new Date() } as never);
    const res = await GET(new Request("http://x") as never, { params: Promise.resolve({ listingId: "l1" }) } as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.draft.id).toBe("d1");
    expect(body.draft).not.toHaveProperty("aiEvents");
  });
});
