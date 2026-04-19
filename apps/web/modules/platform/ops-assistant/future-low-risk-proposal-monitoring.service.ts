/**
 * Proposal telemetry — prefix [ops-assistant:proposal]; never throws.
 */

const LOG_PREFIX = "[ops-assistant:proposal]";

const counts = {
  created: 0,
  submitted: 0,
  acceptedToRegistry: 0,
  rejected: 0,
  archived: 0,
};

function log(msg: string): void {
  try {
    console.info(`${LOG_PREFIX} ${msg}`);
  } catch {
    /* ignore */
  }
}

export function recordLowRiskProposalCreated(): void {
  try {
    counts.created += 1;
    log(`created total=${counts.created}`);
  } catch {
    /* ignore */
  }
}

export function recordLowRiskProposalSubmitted(): void {
  try {
    counts.submitted += 1;
    log(`submitted total=${counts.submitted}`);
  } catch {
    /* ignore */
  }
}

export function recordLowRiskProposalAcceptedToRegistry(): void {
  try {
    counts.acceptedToRegistry += 1;
    log(`accepted_to_registry total=${counts.acceptedToRegistry}`);
  } catch {
    /* ignore */
  }
}

export function recordLowRiskProposalRejected(): void {
  try {
    counts.rejected += 1;
    log(`rejected total=${counts.rejected}`);
  } catch {
    /* ignore */
  }
}

export function recordLowRiskProposalArchived(): void {
  try {
    counts.archived += 1;
    log(`archived total=${counts.archived}`);
  } catch {
    /* ignore */
  }
}

export function getLowRiskProposalMonitoringSnapshot(): Readonly<typeof counts> {
  return { ...counts };
}

export function resetLowRiskProposalMonitoringForTests(): void {
  try {
    counts.created = 0;
    counts.submitted = 0;
    counts.acceptedToRegistry = 0;
    counts.rejected = 0;
    counts.archived = 0;
  } catch {
    /* ignore */
  }
}
