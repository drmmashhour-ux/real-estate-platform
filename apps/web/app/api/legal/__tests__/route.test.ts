import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
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

describe("GET /api/legal", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
  });

  it("returns disabled payload when hub flag off", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/legal"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { disabled?: boolean };
    expect(body.disabled).toBe(true);
  });
});
