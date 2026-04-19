/**
 * Classifies week-over-week Fast Deal aggregates — deterministic bands.
 */

export type ExecCounts = {
  leadsCaptured: number;
  brokersSourced: number;
  playbooksCompleted: number;
};

const MIN_VOLUME = 12;

export function classifyWeeklySignals(params: {
  current: ExecCounts;
  prior: ExecCounts;
  totalEventsInWeek: number;
}): {
  positiveSignals: string[];
  negativeSignals: string[];
  insufficientSignals: string[];
} {
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];
  const insufficientSignals: string[] = [];

  if (params.totalEventsInWeek < MIN_VOLUME) {
    insufficientSignals.push(
      `Fast Deal event volume (${params.totalEventsInWeek}) is below ${MIN_VOLUME} — week-over-week deltas are not reliable.`,
    );
  }

  const dLeads = params.current.leadsCaptured - params.prior.leadsCaptured;
  const dBrokers = params.current.brokersSourced - params.prior.brokersSourced;
  const dPb = params.current.playbooksCompleted - params.prior.playbooksCompleted;

  if (params.totalEventsInWeek >= MIN_VOLUME) {
    if (dLeads >= 2) positiveSignals.push("Lead capture events increased vs prior period (logged).");
    if (dLeads <= -2) negativeSignals.push("Lead capture events decreased vs prior period (logged).");

    if (dBrokers >= 2) positiveSignals.push("Broker sourcing activity increased vs prior period (logged).");
    if (dBrokers <= -2) negativeSignals.push("Broker sourcing activity decreased vs prior period (logged).");

    if (dPb >= 1) positiveSignals.push("Playbook completions increased vs prior period (logged).");
    if (dPb <= -1) negativeSignals.push("Playbook completions declined vs prior period (logged).");
  }

  if (params.current.leadsCaptured === 0 && params.current.brokersSourced === 0) {
    insufficientSignals.push("No sourcing or landing capture logs this week — cannot judge execution mix.");
  }

  return { positiveSignals, negativeSignals, insufficientSignals };
}
