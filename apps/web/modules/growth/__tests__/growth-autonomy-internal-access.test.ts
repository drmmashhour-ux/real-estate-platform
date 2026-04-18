import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PlatformRole } from "@prisma/client";

describe("growth-autonomy-internal-access", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.GROWTH_AUTONOMY_INTERNAL_OPERATOR_USER_IDS;
    delete process.env.NEXT_PUBLIC_GROWTH_AUTONOMY_INTERNAL_UI;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows admin regardless of allowlist", async () => {
    const { viewerReceivesGrowthAutonomySnapshotInternal } = await import("../growth-autonomy-internal-access");
    expect(
      viewerReceivesGrowthAutonomySnapshotInternal({
        role: PlatformRole.ADMIN,
        userId: "any",
        debugRequest: false,
      }),
    ).toBe(true);
  });

  it("allows internal operator allowlist user ids", async () => {
    vi.stubEnv("GROWTH_AUTONOMY_INTERNAL_OPERATOR_USER_IDS", " id-a , id-b ");
    const { viewerReceivesGrowthAutonomySnapshotInternal } = await import("../growth-autonomy-internal-access");
    expect(
      viewerReceivesGrowthAutonomySnapshotInternal({
        role: PlatformRole.USER,
        userId: "id-b",
        debugRequest: false,
      }),
    ).toBe(true);
    expect(
      viewerReceivesGrowthAutonomySnapshotInternal({
        role: PlatformRole.USER,
        userId: "unknown",
        debugRequest: false,
      }),
    ).toBe(false);
  });

  it("allows debug query bypass in production", async () => {
    const { viewerReceivesGrowthAutonomySnapshotInternal } = await import("../growth-autonomy-internal-access");
    expect(
      viewerReceivesGrowthAutonomySnapshotInternal({
        role: PlatformRole.USER,
        userId: "unknown",
        debugRequest: true,
      }),
    ).toBe(true);
  });
});
