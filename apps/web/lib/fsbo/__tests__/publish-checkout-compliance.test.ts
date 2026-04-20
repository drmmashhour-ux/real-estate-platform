import { describe, expect, it } from "vitest";

/** Structural guard: publish checkout exposes compliance block typing for FSBO flows. */
describe("publish-checkout compliance typing", () => {
  it("defines COMPLIANCE_BLOCK branch on FsboPublishCheckoutResult", async () => {
    const mod = await import("../publish-checkout");
    expect(typeof mod.startFsboListingPublishCheckout).toBe("function");
    type R = Awaited<ReturnType<typeof mod.startFsboListingPublishCheckout>>;
    const sample: Extract<R, { ok: false }> = {
      ok: false,
      error: "COMPLIANCE_BLOCK",
      status: 403,
      compliance: {
        reasons: [],
        blockingIssues: [],
        readinessScore: 0,
      },
    };
    expect(sample.error).toBe("COMPLIANCE_BLOCK");
  });
});
