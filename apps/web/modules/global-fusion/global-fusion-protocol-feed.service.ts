/**
 * Phase H — stable protocol feed for optional consumers (read-only).
 */
import { globalFusionFlags } from "@/config/feature-flags";
import { buildGlobalFusionOperatingProtocol, type BuildOperatingProtocolOpts } from "./global-fusion-protocol.service";
import { buildSwarmProtocolPayload } from "./protocol-mappers/swarm-protocol-mapper.service";
import { buildGrowthLoopProtocolPayload } from "./protocol-mappers/growth-loop-protocol-mapper.service";
import { buildOperatorProtocolPayload } from "./protocol-mappers/operator-protocol-mapper.service";
import { buildPlatformCoreProtocolPayload } from "./protocol-mappers/platform-core-protocol-mapper.service";
import { buildCommandCenterProtocolPayload } from "./protocol-mappers/command-center-protocol-mapper.service";
import type { GlobalFusionProtocolFeed } from "./global-fusion.types";

/**
 * Build full feed when `FEATURE_GLOBAL_FUSION_PROTOCOL_FEED_V1` is on.
 */
export async function buildGlobalFusionProtocolFeed(opts: BuildOperatingProtocolOpts = {}): Promise<GlobalFusionProtocolFeed | null> {
  if (!globalFusionFlags.globalFusionProtocolFeedV1) return null;
  const { protocol } = await buildGlobalFusionOperatingProtocol(opts);
  const warnings: string[] = [];
  if (!protocol.active) warnings.push("protocol_inactive");
  if (protocol.signals.length === 0 && protocol.active) warnings.push("empty_signals");
  return {
    protocol,
    perSystem: {
      swarm: buildSwarmProtocolPayload(protocol),
      growth_loop: buildGrowthLoopProtocolPayload(protocol),
      operator: buildOperatorProtocolPayload(protocol),
      platform_core: buildPlatformCoreProtocolPayload(protocol),
      command_center: buildCommandCenterProtocolPayload(protocol),
    },
    meta: {
      feedVersion: 1,
      generatedAt: protocol.generatedAt,
      protocolEnabled: globalFusionFlags.globalFusionProtocolV1,
      protocolFeedEnabled: true,
      protocolMonitoringEnabled: globalFusionFlags.globalFusionProtocolMonitoringV1,
      warnings,
    },
  };
}
