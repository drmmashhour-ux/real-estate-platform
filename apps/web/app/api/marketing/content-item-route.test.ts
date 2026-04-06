import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { PATCH } from "./content/[id]/route";

vi.mock("@/app/api/ai/admin-guard", () => ({
  requireAdminSurfaceApi: vi.fn(),
}));

vi.mock("@/lib/marketing/marketing-content-service", () => ({
  getContent: vi.fn(),
  updateContent: vi.fn(),
}));

import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { getContent, updateContent } from "@/lib/marketing/marketing-content-service";

function patchReq(body: unknown) {
  return new Request("http://localhost/api/marketing/content/x1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("PATCH /api/marketing/content/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAdminSurfaceApi).mockResolvedValue(null);
    vi.mocked(getContent).mockResolvedValue({ id: "x1" } as never);
    vi.mocked(updateContent).mockResolvedValue({
      id: "x1",
      status: "APPROVED",
      scheduledAt: null,
    });
  });

  it("updates status", async () => {
    const res = await PATCH(patchReq({ status: "APPROVED" }), { params: Promise.resolve({ id: "x1" }) });
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok?: boolean };
    expect(j.ok).toBe(true);
    expect(updateContent).toHaveBeenCalledWith("x1", expect.objectContaining({ status: "APPROVED" }));
  });

  it("clears scheduled time via clearScheduledAt", async () => {
    const res = await PATCH(patchReq({ clearScheduledAt: true }), {
      params: Promise.resolve({ id: "x1" }),
    });
    expect(res.status).toBe(200);
    expect(updateContent).toHaveBeenCalledWith(
      "x1",
      expect.objectContaining({ scheduledAt: null })
    );
  });
});
