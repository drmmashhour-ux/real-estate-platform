import type { PlatformRole } from "@prisma/client";
import { ingestSignalsForUser } from "./core/signal-ingestion.service";
import { collectProposedActions } from "./ai-autopilot.registry";
import { rankProposedActions } from "./core/action-ranking.service";
import type { RankedAction } from "./ai-autopilot.types";

export async function runUnifiedDetection(opts: { userId: string; role: PlatformRole }): Promise<{
  signals: Awaited<ReturnType<typeof ingestSignalsForUser>>;
  ranked: RankedAction[];
}> {
  const signals = await ingestSignalsForUser(opts);
  const proposed = await collectProposedActions({ ...opts, signals });
  const ranked = rankProposedActions(proposed);
  return { signals, ranked };
}
