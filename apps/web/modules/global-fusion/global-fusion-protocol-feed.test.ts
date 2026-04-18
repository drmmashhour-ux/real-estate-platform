import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    globalFusionFlags: {
      ...a.globalFusionFlags,
      globalFusionProtocolV1: true,
      globalFusionProtocolFeedV1: true,
    },
  };
});

vi.mock("./global-fusion-protocol.service", async (importOriginal) => {
  const a = await importOriginal<typeof import("./global-fusion-protocol.service")>();
  return {
    ...a,
    buildGlobalFusionOperatingProtocol: vi.fn(),
  };
});

import { globalFusionFlags } from "@/config/feature-flags";
import { buildGlobalFusionOperatingProtocol } from "./global-fusion-protocol.service";
import { buildGlobalFusionProtocolFeed } from "./global-fusion-protocol-feed.service";
import type { GlobalFusionOperatingProtocol } from "./global-fusion.types";

function minimalProtocol(): GlobalFusionOperatingProtocol {
  return {
    generatedAt: new Date().toISOString(),
    active: true,
    priorities: [],
    risks: [],
    opportunities: [],
    blockers: [],
    directives: [],
    alignment: [],
    conflicts: [],
    signals: [],
    meta: { protocolVersion: 1, contributingSystemsCount: 0, executiveSummaryUsed: true, governanceDecision: null, notes: [] },
  };
}

describe("global-fusion-protocol-feed", () => {
  beforeEach(() => {
    (globalFusionFlags as { globalFusionProtocolFeedV1: boolean }).globalFusionProtocolFeedV1 = true;
    vi.mocked(buildGlobalFusionOperatingProtocol).mockResolvedValue({
      protocol: minimalProtocol(),
      executiveSummary: {} as never,
    });
  });

  it("returns null when protocol feed flag is off", async () => {
    (globalFusionFlags as { globalFusionProtocolFeedV1: boolean }).globalFusionProtocolFeedV1 = false;
    expect(await buildGlobalFusionProtocolFeed({})).toBeNull();
    (globalFusionFlags as { globalFusionProtocolFeedV1: boolean }).globalFusionProtocolFeedV1 = true;
  });

  it("returns perSystem keys when feed flag on", async () => {
    const feed = await buildGlobalFusionProtocolFeed({});
    expect(feed?.perSystem.swarm.version).toBe(1);
    expect(feed?.meta.feedVersion).toBe(1);
    expect(feed?.perSystem.growth_loop).toBeDefined();
  });
});
