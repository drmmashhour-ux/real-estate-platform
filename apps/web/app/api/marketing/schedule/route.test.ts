import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/app/api/ai/admin-guard", () => ({
  requireAdminSurfaceApi: vi.fn(),
}));

vi.mock("@/lib/marketing/marketing-content-service", () => ({
  getContent: vi.fn(),
  scheduleContent: vi.fn(),
}));

import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { getContent, scheduleContent } from "@/lib/marketing/marketing-content-service";

describe("POST /api/marketing/schedule", () => {
  beforeEach(() => {
    vi.mocked(requireAdminSurfaceApi).mockResolvedValue(null);
    vi.mocked(getContent).mockResolvedValue({ id: "c1", status: "APPROVED" } as never);
    vi.mocked(scheduleContent).mockResolvedValue({
      id: "c1",
      status: "SCHEDULED",
      scheduledAt: new Date("2026-06-01"),
    });
  });

  it("rejects draft without approval", async () => {
    vi.mocked(getContent).mockResolvedValue({ id: "c1", status: "DRAFT" } as never);
    const res = await POST(
      new Request("http://localhost/api/marketing/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: "c1", scheduledAt: "2026-06-01T12:00:00.000Z" }),
      }) as NextRequest
    );
    expect(res.status).toBe(400);
    const j = (await res.json()) as { code?: string };
    expect(j.code).toBe("INVALID_STATE");
  });

  it("sets scheduled state", async () => {
    const res = await POST(
      new Request("http://localhost/api/marketing/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: "c1", scheduledAt: "2026-06-01T12:00:00.000Z" }),
      }) as NextRequest
    );
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok?: boolean };
    expect(j.ok).toBe(true);
    expect(scheduleContent).toHaveBeenCalled();
  });
});
