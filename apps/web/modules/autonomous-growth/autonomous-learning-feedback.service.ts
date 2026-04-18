import { oneBrainV2Flags, platformCoreFlags } from "@/config/feature-flags";
import { appendAutonomousRunEvents, getAutonomousRunById, listAutonomousRunEvents } from "./autonomous-growth.repository";

/**
 * Connects completed runs to brain / platform learning without inventing post-hoc outcomes.
 */
export async function ingestAutonomousRunIntoLearning(runId: string): Promise<{
  ok: boolean;
  notes: string[];
}> {
  const notes: string[] = [];
  await getAutonomousRunById(runId);

  const events = await listAutonomousRunEvents(runId, 400);
  const executed = events.filter((e) => e.stage === "EXECUTED");

  if (executed.length === 0) {
    notes.push("No EXECUTED events — nothing to ingest (outcomes are not fabricated).");
    await appendAutonomousRunEvents(runId, [
      {
        stage: "LEARNED",
        message:
          "Learning pass skipped — no executed actions to correlate. Schedule reevaluation when metrics are available.",
      },
    ]);
    return { ok: true, notes };
  }

  if (platformCoreFlags.platformCoreV1 && oneBrainV2Flags.oneBrainV2OutcomeIngestionV1) {
    try {
      const { collectRecentDecisionOutcomes } = await import(
        "@/modules/platform-core/brain-outcome-ingestion.service"
      );
      const batch = await collectRecentDecisionOutcomes();
      notes.push(
        `Brain outcome ingestion batch: created ${batch.created}, skipped ${batch.skipped} (existing pipeline; no synthetic outcomes added for this run).`,
      );
    } catch (e) {
      notes.push(`Brain outcome hook skipped: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    notes.push("One Brain outcome ingestion disabled — enable FEATURE_ONE_BRAIN_V2_OUTCOME_INGESTION_V1 for full loop.");
  }

  await appendAutonomousRunEvents(runId, [
    {
      stage: "LEARNED",
      message:
        "Learning feedback recorded — delayed metrics should be evaluated via reevaluation scheduler; immediate outcomes are not assumed.",
      metadata: { executedEventCount: executed.length },
    },
  ]);

  return { ok: true, notes };
}
