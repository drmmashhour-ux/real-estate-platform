import { buildMontrealMarketSnapshot } from "@/modules/market-intelligence/montreal-market.service";
import { pickDominationZones, type DominationZone } from "./neighborhood-domination.service";
import { buildMontrealLaunchSequence, type LaunchWave } from "./launch-sequencer.service";

export type DominationBundle = {
  zones: DominationZone[];
  launchWaves: LaunchWave[];
  generatedAt: string;
};

export async function buildDominationBundle(): Promise<DominationBundle> {
  const snap = await buildMontrealMarketSnapshot();
  const zones = pickDominationZones(snap.opportunities, 5);
  const launchWaves = buildMontrealLaunchSequence(zones.map((z) => z.zone));
  return { zones, launchWaves, generatedAt: new Date().toISOString() };
}
