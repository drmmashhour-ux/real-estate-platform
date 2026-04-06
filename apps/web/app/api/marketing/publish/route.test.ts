import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/app/api/ai/admin-guard", () => ({
  requireAdminSurfaceApi: vi.fn(),
}));

vi.mock("@/lib/marketing-publish/publish-content", () => ({
  publishMarketingContent: vi.fn(),
}));

import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { publishMarketingContent } from "@/lib/marketing-publish/publish-content";

function req(body: unknown) {
  return new Request("http://localhost/api/marketing/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("POST /api/marketing/publish", () => {
  beforeEach(() => {
    vi.mocked(requireAdminSurfaceApi).mockResolvedValue(null);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(requireAdminSurfaceApi).mockResolvedValue(new Response(null, { status: 401 }));
    const res = await POST(req({ contentId: "c1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 on missing contentId", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("returns 200 when publish succeeds", async () => {
    vi.mocked(publishMarketingContent).mockResolvedValue({
      ok: true,
      jobId: "j1",
      contentStatus: "PUBLISHED",
      executedDryRun: true,
      summary: "ok",
      externalPostId: null,
    });
    const res = await POST(req({ contentId: "c1", dryRun: true }));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok?: boolean; jobId?: string };
    expect(j.ok).toBe(true);
    expect(j.jobId).toBe("j1");
  });

  it("maps NOT_FOUND to 404", async () => {
    vi.mocked(publishMarketingContent).mockResolvedValue({
      ok: false,
      code: "NOT_FOUND",
      error: "gone",
    });
    const res = await POST(req({ contentId: "c1" }));
    expect(res.status).toBe(404);
  });
});
