import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/lib/auth/is-platform-admin", () => ({ isPlatformAdmin: vi.fn() }));
vi.mock("@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository", () => ({ listApprovalQueue: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { listApprovalQueue } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";

describe("GET /api/legal-workflow/queue", () => {
  it("requires admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(isPlatformAdmin).mockResolvedValue(false as never);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns queue items", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(isPlatformAdmin).mockResolvedValue(true as never);
    vi.mocked(listApprovalQueue).mockResolvedValue([] as never);
    const res = await GET();
    expect(res.status).toBe(200);
  });
});
