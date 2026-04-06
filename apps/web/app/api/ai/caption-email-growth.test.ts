import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { POST as postCaption } from "./caption/route";
import { POST as postEmail } from "./email/route";
import { POST as postGrowth } from "./growth-ideas/route";

vi.mock("@/lib/marketing-analytics/prompt-hints", () => ({
  getGenerationAnalyticsHints: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/api/ai/admin-guard", () => ({
  requireAdminSurfaceApi: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/lib/ai-marketing/generate-caption", () => ({
  generateCaption: vi.fn(),
  generateCaptionVariants: vi.fn(),
}));

vi.mock("@/lib/ai-marketing/generate-email", () => ({
  generateEmail: vi.fn(),
  generateEmailVariants: vi.fn(),
}));

vi.mock("@/lib/ai-marketing/generate-growth-ideas", () => ({
  generateGrowthIdeas: vi.fn(),
  generateGrowthIdeasVariants: vi.fn(),
}));

vi.mock("@/lib/marketing/marketing-content-service", () => ({
  createDraft: vi.fn(),
  createVariantDraftGroup: vi.fn(),
}));

import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { getGuestId } from "@/lib/auth/session";
import { generateCaption } from "@/lib/ai-marketing/generate-caption";
import { generateEmail } from "@/lib/ai-marketing/generate-email";
import { generateGrowthIdeas } from "@/lib/ai-marketing/generate-growth-ideas";
import { createDraft, createVariantDraftGroup } from "@/lib/marketing/marketing-content-service";

function jsonRequest(url: string, body: Record<string, unknown>): NextRequest {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("POST /api/ai/caption, email, growth-ideas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSurfaceApi).mockResolvedValue(null);
    vi.mocked(getGuestId).mockResolvedValue("user-1");
    vi.mocked(generateCaption).mockResolvedValue({
      text: "Caption body",
      source: "fallback",
    });
    vi.mocked(generateEmail).mockResolvedValue({
      subject: "Subj",
      body: "Body",
      cta: "Click",
      source: "fallback",
    });
    vi.mocked(generateGrowthIdeas).mockResolvedValue({
      ideas: ["Idea one"],
      source: "fallback",
    });
    vi.mocked(createDraft).mockResolvedValue("draft-x");
    vi.mocked(createVariantDraftGroup).mockResolvedValue({ parentId: "p1", allIds: ["p1", "v2"] });
  });

  it("caption: ok + source + contentId on saveDraft", async () => {
    const res = await postCaption(
      jsonRequest("http://localhost/api/ai/caption", { saveDraft: true })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      ok?: boolean;
      source?: string;
      contentId?: string | null;
      text?: string;
    };
    expect(data.ok).toBe(true);
    expect(data.source).toBe("fallback");
    expect(data.contentId).toBe("draft-x");
    expect(data.text).toBe("Caption body");
    expect(createDraft).toHaveBeenCalled();
  });

  it("email: ok + source + contentId on saveDraft", async () => {
    const res = await postEmail(
      jsonRequest("http://localhost/api/ai/email", { saveDraft: true })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      ok?: boolean;
      source?: string;
      contentId?: string | null;
    };
    expect(data.ok).toBe(true);
    expect(data.source).toBe("fallback");
    expect(data.contentId).toBe("draft-x");
    expect(createDraft).toHaveBeenCalled();
  });

  it("growth-ideas: ok + source + contentId + text on saveDraft", async () => {
    const res = await postGrowth(
      jsonRequest("http://localhost/api/ai/growth-ideas", { saveDraft: true })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      ok?: boolean;
      source?: string;
      contentId?: string | null;
      text?: string;
      ideas?: string[];
    };
    expect(data.ok).toBe(true);
    expect(data.source).toBe("fallback");
    expect(data.contentId).toBe("draft-x");
    expect(data.text).toContain("1.");
    expect(data.ideas).toEqual(["Idea one"]);
    expect(createDraft).toHaveBeenCalled();
  });

  it("returns structured error when unauthorized", async () => {
    vi.mocked(requireAdminSurfaceApi).mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }), {
        status: 401,
      })
    );
    const res = await postCaption(jsonRequest("http://localhost/api/ai/caption", {}));
    expect(res.status).toBe(401);
    const j = (await res.json()) as { ok?: boolean; error?: string; code?: string };
    expect(j.ok).toBe(false);
    expect(j.code).toBe("UNAUTHORIZED");
  });
});
