import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    platformCoreFlags: { ...a.platformCoreFlags, platformCoreV1: true },
  };
});

vi.mock("./brain-snapshot.service", () => ({
  buildBrainSnapshot: vi.fn(),
}));

vi.mock("./brain-v8-primary-routing.service", () => ({
  buildBrainOutputWithV8Routing: vi.fn(),
}));

import { buildBrainSnapshot } from "./brain-snapshot.service";
import { buildBrainOutputWithV8Routing } from "./brain-v8-primary-routing.service";
import { resolveDashboardBrainPayload } from "./brain-v8-dashboard-brain-resolve";

describe("resolveDashboardBrainPayload", () => {
  const snap = { weights: [], recentOutcomes: [] } as Awaited<ReturnType<typeof buildBrainSnapshot>>;

  beforeEach(() => {
    vi.mocked(buildBrainSnapshot).mockResolvedValue(snap);
    vi.mocked(buildBrainOutputWithV8Routing).mockImplementation((s) => ({ ...s, brainV8Influence: undefined }));
  });

  it("legacy mode returns raw snapshot and does not call V8 routing", async () => {
    const out = await resolveDashboardBrainPayload("legacy_snapshot");
    expect(out).toBe(snap);
    expect(buildBrainOutputWithV8Routing).not.toHaveBeenCalled();
  });

  it("v8_overlay mode runs buildBrainOutputWithV8Routing", async () => {
    await resolveDashboardBrainPayload("v8_overlay");
    expect(buildBrainOutputWithV8Routing).toHaveBeenCalledWith(snap);
  });
});
