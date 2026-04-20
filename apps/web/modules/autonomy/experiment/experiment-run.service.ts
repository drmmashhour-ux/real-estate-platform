import { completeExperimentAndApplyLearning } from "./experiment-completion.service";
import { recordAllExperimentOutcomes } from "./experiment-outcome.service";

/** Fresh KPI snapshots for all assignments, then close experiment + aggregate + bounded rule-weight nudge. */
export async function runExperimentFullPipeline(experimentId: string) {
  await recordAllExperimentOutcomes(experimentId);
  return completeExperimentAndApplyLearning(experimentId);
}
