import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/modules/analytics/services/require-admin", () => ({
  requireAdminUser: vi.fn(),
}));

vi.mock("@/config/feature-flags", async (imp) => {
  const actual = await imp<typeof import("@/config/feature-flags")>();
  return {
    ...actual,
    legalHubFlags: {
      legalHubV1: false,
      legalHubDocumentsV1: false,
      legalHubRisksV1: false,
      legalHubAdminReviewV1: false,
      legalUploadV1: false,
      legalReviewV1: false,
      legalWorkflowSubmissionV1: false,
      legalEnforcementV1: false,
      legalReadinessV1: false,
    },
  };
});

import { GET } from "../route";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";

describe("GET /api/admin/legal", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
    vi.mocked(requireAdminUser).mockReset();
  });

  it("returns 403 when not admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(requireAdminUser).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns disabled when admin review flag off", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(requireAdminUser).mockResolvedValue({ userId: "admin", role: "ADMIN" });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { disabled?: boolean };
    expect(body.disabled).toBe(true);
  });
});
