import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/growth/channels/route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/lib/auth/is-platform-admin", () => ({ isPlatformAdmin: vi.fn() }));
vi.mock("@/src/modules/growth-automation/application/getConnectedChannels", () => ({
  getConnectedChannels: vi.fn(),
}));

import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getConnectedChannels } from "@/src/modules/growth-automation/application/getConnectedChannels";

describe("GET /api/growth/channels", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
    vi.mocked(isPlatformAdmin).mockReset();
    vi.mocked(getConnectedChannels).mockReset();
  });

  it("returns 403 when not admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns channels for admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin-id");
    vi.mocked(isPlatformAdmin).mockResolvedValue(true);
    vi.mocked(getConnectedChannels).mockResolvedValue([{ id: "c1", platform: "BLOG" }]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.channels).toHaveLength(1);
  });
});
