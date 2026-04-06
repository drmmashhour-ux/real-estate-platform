import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/app/api/ai/admin-guard", () => ({
  requireAdminSurfaceApi: vi.fn(),
}));

vi.mock("@/lib/marketing/marketing-content-service", () => ({
  listContent: vi.fn(),
  fromPrismaContentType: (t: string) => {
    const m: Record<string, string> = {
      SOCIAL_POST: "social_post",
      CAPTION: "caption",
      EMAIL: "email",
      GROWTH_IDEA: "growth_idea",
    };
    return m[t] ?? "social_post";
  },
}));

import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { listContent } from "@/lib/marketing/marketing-content-service";

describe("GET /api/marketing/content", () => {
  beforeEach(() => {
    vi.mocked(requireAdminSurfaceApi).mockResolvedValue(null);
    vi.mocked(listContent).mockResolvedValue([
      {
        id: "c1",
        type: "SOCIAL_POST",
        content: "Hello world content",
        platform: "Instagram",
        topic: "BNHub",
        tone: "pro",
        audience: "all",
        theme: null,
        status: "DRAFT",
        scheduledAt: null,
        createdAt: new Date("2026-01-02"),
        aiSource: "fallback",
        emailSubject: null,
        emailBody: null,
        emailCta: null,
        isEmailCampaign: false,
      },
    ]);
  });

  it("returns 401 when guard denies", async () => {
    vi.mocked(requireAdminSurfaceApi).mockResolvedValue(new Response(null, { status: 401 }));
    const res = await GET(new Request("http://localhost/api/marketing/content") as NextRequest);
    expect(res.status).toBe(401);
  });

  it("returns newest items with filters passed to list", async () => {
    const res = await GET(
      new Request("http://localhost/api/marketing/content?type=social_post&status=DRAFT") as NextRequest
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok?: boolean; items?: { id: string }[] };
    expect(data.ok).toBe(true);
    expect(data.items?.[0]?.id).toBe("c1");
    expect(listContent).toHaveBeenCalledWith({
      type: "SOCIAL_POST",
      status: "DRAFT",
      hideVariants: true,
    });
  });
});
