import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    platformCoreFlags: { ...a.platformCoreFlags, platformCoreV1: true },
  };
});

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn().mockResolvedValue({ ok: true, userId: "u1" }),
}));

vi.mock("@/modules/platform-core/brain-snapshot.service", () => ({
  buildBrainSnapshot: vi.fn(),
}));

vi.mock("@/modules/platform-core/brain-v8-primary-routing.service", () => ({
  buildBrainOutputWithV8Routing: vi.fn(),
}));

import { buildBrainSnapshot } from "@/modules/platform-core/brain-snapshot.service";
import { buildBrainOutputWithV8Routing } from "@/modules/platform-core/brain-v8-primary-routing.service";
import { getBrainSnapshotAction, getBrainSnapshotWithV8OverlayAction } from "./admin-actions";

describe("admin brain snapshot actions (parallel entry)", () => {
  const snap = { weights: [], recentOutcomes: [] } as Awaited<ReturnType<typeof buildBrainSnapshot>>;

  beforeEach(() => {
    vi.mocked(buildBrainSnapshot).mockResolvedValue(snap);
    vi.mocked(buildBrainOutputWithV8Routing).mockImplementation((s) => ({ ...s, brainV8Influence: undefined }));
  });

  it("getBrainSnapshotAction returns legacy snapshot without routing", async () => {
    const out = await getBrainSnapshotAction();
    expect(out).toBe(snap);
    expect(buildBrainOutputWithV8Routing).not.toHaveBeenCalled();
  });

  it("getBrainSnapshotWithV8OverlayAction applies routing", async () => {
    await getBrainSnapshotWithV8OverlayAction();
    expect(buildBrainOutputWithV8Routing).toHaveBeenCalledWith(snap);
  });
});
