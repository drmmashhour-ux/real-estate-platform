import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/app/api/ai/admin-guard", () => ({
  requireAdminSurfaceApi: vi.fn(),
}));

vi.mock("@/lib/marketing/marketing-content-service", () => ({
  getContent: vi.fn(),
  trackMetrics: vi.fn(),
}));

import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { getContent, trackMetrics } from "@/lib/marketing/marketing-content-service";

function jsonRequest(body: Record<string, unknown>): NextRequest {
  return new Request("http://localhost/api/marketing/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("POST /api/marketing/track", () => {
  beforeEach(() => {
    vi.mocked(requireAdminSurfaceApi).mockResolvedValue(null);
    vi.mocked(getContent).mockResolvedValue({ id: "c1" } as never);
    vi.mocked(trackMetrics).mockResolvedValue({
      id: "m1",
      createdAt: new Date("2026-01-01"),
    });
  });

  it("returns 400 without at least one field", async () => {
    const res = await POST(jsonRequest({ contentId: "c1" }));
    expect(res.status).toBe(400);
    const j = (await res.json()) as { ok?: boolean };
    expect(j.ok).toBe(false);
  });

  it("records notes-only row", async () => {
    const res = await POST(jsonRequest({ contentId: "c1", notes: "  Meta export  " }));
    expect(res.status).toBe(200);
    expect(trackMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ contentId: "c1", notes: "Meta export" })
    );
  });

  it("records a metric row", async () => {
    const res = await POST(jsonRequest({ contentId: "c1", views: 10 }));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok?: boolean };
    expect(j.ok).toBe(true);
    expect(trackMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ contentId: "c1", views: 10 })
    );
  });
});
