import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/lib/auth/is-platform-admin", () => ({
  isPlatformAdminSurface: vi.fn(),
}));

vi.mock("@/lib/ai/openai", () => ({
  isOpenAiConfigured: () => false,
  openai: {},
}));

vi.mock("@/lib/marketing-analytics/prompt-hints", () => ({
  getGenerationAnalyticsHints: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/marketing/marketing-content-service", () => ({
  createDraft: vi.fn(),
  createVariantDraftGroup: vi.fn(),
}));

import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { createDraft, createVariantDraftGroup } from "@/lib/marketing/marketing-content-service";

function jsonRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/ai/social-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("POST /api/ai/social-post", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGuestId).mockResolvedValue("user-1");
    vi.mocked(isPlatformAdminSurface).mockResolvedValue(true);
    vi.mocked(createDraft).mockResolvedValue("draft-1");
    vi.mocked(createVariantDraftGroup).mockResolvedValue({ parentId: "p1", allIds: ["p1", "v2"] });
  });

  it("returns 401 when not admin surface", async () => {
    vi.mocked(isPlatformAdminSurface).mockResolvedValue(false);
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(401);
  });

  it("returns ok + text for empty body (defaults)", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      ok?: boolean;
      text?: string;
      source?: string;
      contentId?: string | null;
    };
    expect(data.ok).toBe(true);
    expect(typeof data.text).toBe("string");
    expect(data.text!.length).toBeGreaterThan(10);
    expect(data.source).toBe("fallback");
    expect(data.contentId).toBeNull();
  });

  it("persists draft when saveDraft is true", async () => {
    const res = await POST(jsonRequest({ saveDraft: true }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { contentId?: string | null };
    expect(data.contentId).toBe("draft-1");
    expect(createDraft).toHaveBeenCalled();
  });

  it("persists draft when save alias is true", async () => {
    const res = await POST(jsonRequest({ save: true }));
    expect(res.status).toBe(200);
    expect(createDraft).toHaveBeenCalled();
  });

  it("handles invalid JSON", async () => {
    const req = new Request("http://localhost/api/ai/social-post", {
      method: "POST",
      body: "not-json",
    }) as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
