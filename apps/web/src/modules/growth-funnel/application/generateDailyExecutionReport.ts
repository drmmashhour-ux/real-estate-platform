import type { ExecutionAlert } from "@/src/modules/growth-funnel/application/computeExecutionAlerts";

export type DailyExecutionReport = {
  whatWorked: string[];
  whatDidnt: string[];
  whatToImprove: string[];
};

export type SnapshotRates = {
  newUsers: number;
  simulatorRuns: number;
  activationRate: number | null;
  retentionRate: number | null;
  conversionRate: number | null;
};

function fmtDelta(prev: number, cur: number): string {
  return `${prev}% → ${cur}%`;
}

export function generateDailyExecutionReport(args: {
  current: SnapshotRates;
  previous: SnapshotRates;
  alerts: ExecutionAlert[];
}): DailyExecutionReport {
  const { current, previous, alerts } = args;
  const whatWorked: string[] = [];
  const whatDidnt: string[] = [];
  const whatToImprove: string[] = [];

  if (
    current.activationRate != null &&
    previous.activationRate != null &&
    current.activationRate > previous.activationRate
  ) {
    whatWorked.push(`Activation ${fmtDelta(current.activationRate, previous.activationRate)}`);
  } else if (
    current.activationRate != null &&
    previous.activationRate != null &&
    current.activationRate < previous.activationRate
  ) {
    whatDidnt.push(`Activation ${fmtDelta(current.activationRate, previous.activationRate)}`);
  }

  if (
    current.retentionRate != null &&
    previous.retentionRate != null &&
    current.retentionRate > previous.retentionRate
  ) {
    whatWorked.push(`Retention ${fmtDelta(previous.retentionRate, current.retentionRate)}`);
  } else if (
    current.retentionRate != null &&
    previous.retentionRate != null &&
    current.retentionRate < previous.retentionRate
  ) {
    whatDidnt.push(`Retention ${fmtDelta(previous.retentionRate, current.retentionRate)}`);
  }

  if (
    current.conversionRate != null &&
    previous.conversionRate != null &&
    current.conversionRate > previous.conversionRate
  ) {
    whatWorked.push(`Upgrade conversion ${fmtDelta(previous.conversionRate, current.conversionRate)}`);
  } else if (
    current.conversionRate != null &&
    previous.conversionRate != null &&
    current.conversionRate < previous.conversionRate
  ) {
    whatDidnt.push(`Upgrade conversion ${fmtDelta(previous.conversionRate, current.conversionRate)}`);
  }

  if (current.newUsers > previous.newUsers) {
    whatWorked.push(`New users +${current.newUsers - previous.newUsers} vs prior window (${current.newUsers} total).`);
  } else if (current.newUsers < previous.newUsers) {
    whatDidnt.push(`New users down (${current.newUsers} vs ${previous.newUsers}).`);
  }

  if (current.simulatorRuns > previous.simulatorRuns) {
    whatWorked.push(`Simulator runs up (${current.simulatorRuns} vs ${previous.simulatorRuns}).`);
  } else if (current.simulatorRuns < previous.simulatorRuns) {
    whatDidnt.push(`Simulator runs down (${current.simulatorRuns} vs ${previous.simulatorRuns}).`);
  }

  for (const al of alerts) {
    whatToImprove.push(al.message);
  }

  if (whatWorked.length === 0) {
    whatWorked.push("No strong week-over-week gains in headline rates — focus on the improvement list below.");
  }
  if (whatDidnt.length === 0) {
    whatDidnt.push("No major regressions in headline rates vs the prior period.");
  }
  if (whatToImprove.length === 0) {
    whatToImprove.push("Keep shipping: tighten landing → simulator time-to-value and save prompts after first run.");
  }

  return { whatWorked, whatDidnt, whatToImprove };
}
