import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

vi.mock("@/lib/db", () => ({
  prisma: {
    autonomousPolicySetting: {
      findMany: vi.fn(async () => []),
    },
  },
}));

describe("autonomy.engine", () => {
  it("dry run returns summary without throwing", async () => {
    const { runAutonomousOperations } = await import("@/modules/autonomy/autonomy.engine");
    const s = await runAutonomousOperations({
      dryRun: true,
      portfolioHints: [{ dealId: "x", stalled: true }],
    });
    expect(s.rationale).toContain("dryRun=true");
    expect(Array.isArray(s.blockedActions)).toBe(true);
  });
});
