import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const publishMock = vi.fn();

vi.mock("@/lib/content-automation/publish-direct-job", () => ({
  publishContentJobDirect: (...args: unknown[]) => publishMock(...args),
}));

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/lib/auth/is-platform-admin", () => ({
  isPlatformAdmin: vi.fn(),
}));

import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

function req(body: Record<string, unknown>, jobId = "job-1"): NextRequest {
  return new NextRequest(new URL(`http://localhost/api/content/${jobId}/publish`), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/content/[id]/publish", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockResolvedValue("admin-1");
    vi.mocked(isPlatformAdmin).mockResolvedValue(true);
    publishMock.mockResolvedValue({ ok: true, detail: {} });
  });

  it("returns 403 when not admin", async () => {
    vi.mocked(isPlatformAdmin).mockResolvedValue(false);
    const r = await POST(req({ platform: "instagram" }), { params: Promise.resolve({ id: "j1" }) });
    expect(r.status).toBe(403);
  });

  it("calls publishContentJobDirect with actor user id", async () => {
    const r = await POST(req({ platform: "instagram" }), { params: Promise.resolve({ id: "job-xyz" }) });
    expect(r.status).toBe(200);
    expect(publishMock).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job-xyz",
        platform: "instagram",
        actorUserId: "admin-1",
      }),
    );
  });
});
