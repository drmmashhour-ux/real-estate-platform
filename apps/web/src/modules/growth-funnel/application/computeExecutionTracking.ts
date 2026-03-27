import { buildExecutionAlerts } from "@/src/modules/growth-funnel/application/computeExecutionAlerts";
import { generateDailyExecutionReport } from "@/src/modules/growth-funnel/application/generateDailyExecutionReport";
import {
  countDistinctUsersWithEventInRange,
  countEventsByNameInRange,
  countNewUsersInRange,
  countSequentialFlowUsers,
  getDailyNewUsersAndSimulatorRuns,
} from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";

function rate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 10000) / 100;
}

export type FlowStep = {
  label: string;
  completed: number;
  denominator: number;
  conversionPercent: number | null;
};

export type ExecutionSnapshot = {
  windowDays: number;
  windowStart: string;
  windowEnd: string;
  newUsers: number;
  simulatorRuns: number;
  activationRate: number | null;
  returnUsers: number;
  conversionRate: number | null;
  retentionRate: number | null;
  flows: {
    landingToSimulator: FlowStep;
    simulatorToSave: FlowStep;
    saveToReturn: FlowStep;
    returnToUpgrade: FlowStep;
  };
};

async function computeSnapshot(windowDays: number, windowEnd: Date): Promise<ExecutionSnapshot> {
  const windowStart = new Date(windowEnd);
  windowStart.setUTCDate(windowStart.getUTCDate() - windowDays);

  const [
    newUsers,
    simulatorRuns,
    signupUsers,
    firstActionCompleted,
    simulatorUsers,
    scenarioSavedUsers,
    returnVisitUsers,
    landingUsers,
    upgradeClicked,
    upgradeCompleted,
    landingToSimulator,
    simulatorToSave,
    saveToReturn,
    returnToUpgrade,
  ] = await Promise.all([
    countNewUsersInRange(windowStart, windowEnd),
    countEventsByNameInRange("simulator_used", windowStart, windowEnd),
    countDistinctUsersWithEventInRange("signup_started", windowStart, windowEnd),
    countDistinctUsersWithEventInRange("first_action_completed", windowStart, windowEnd),
    countDistinctUsersWithEventInRange("simulator_used", windowStart, windowEnd),
    countDistinctUsersWithEventInRange("scenario_saved", windowStart, windowEnd),
    countDistinctUsersWithEventInRange("return_visit", windowStart, windowEnd),
    countDistinctUsersWithEventInRange("landing_visit", windowStart, windowEnd),
    countEventsByNameInRange("upgrade_clicked", windowStart, windowEnd),
    countEventsByNameInRange("upgrade_completed", windowStart, windowEnd),
    countSequentialFlowUsers("landing_visit", "simulator_used", windowStart, windowEnd),
    countSequentialFlowUsers("simulator_used", "scenario_saved", windowStart, windowEnd),
    countSequentialFlowUsers("scenario_saved", "return_visit", windowStart, windowEnd),
    countSequentialFlowUsers("return_visit", "upgrade_clicked", windowStart, windowEnd),
  ]);

  const activationRate = rate(firstActionCompleted, Math.max(signupUsers, 1));
  const retentionRate = rate(returnVisitUsers, Math.max(simulatorUsers, 1));
  const conversionRate = rate(upgradeCompleted, Math.max(upgradeClicked, 1));

  const flow = (label: string, completed: number, denominator: number): FlowStep => ({
    label,
    completed,
    denominator,
    conversionPercent: rate(completed, Math.max(denominator, 1)),
  });

  return {
    windowDays,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    newUsers,
    simulatorRuns,
    activationRate,
    returnUsers: returnVisitUsers,
    conversionRate,
    retentionRate,
    flows: {
      landingToSimulator: flow("Landing → simulator", landingToSimulator, landingUsers),
      simulatorToSave: flow("Simulator → save", simulatorToSave, simulatorUsers),
      saveToReturn: flow("Save → return visit", saveToReturn, scenarioSavedUsers),
      returnToUpgrade: flow("Return → upgrade click", returnToUpgrade, returnVisitUsers),
    },
  };
}

export type ExecutionTrackingPayload = {
  windowDays: number;
  current: ExecutionSnapshot;
  previous: ExecutionSnapshot;
  daily: Awaited<ReturnType<typeof getDailyNewUsersAndSimulatorRuns>>;
  alerts: ReturnType<typeof buildExecutionAlerts>;
  report: ReturnType<typeof generateDailyExecutionReport>;
};

export async function computeExecutionTracking(windowDays: number): Promise<ExecutionTrackingPayload> {
  const now = new Date();
  const currentEnd = now;
  const currentStart = new Date(now);
  currentStart.setUTCDate(currentStart.getUTCDate() - windowDays);

  const previousEnd = currentStart;
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - windowDays);

  const [current, previous, daily] = await Promise.all([
    computeSnapshot(windowDays, currentEnd),
    computeSnapshot(windowDays, previousEnd),
    getDailyNewUsersAndSimulatorRuns(Math.min(14, Math.max(7, windowDays))),
  ]);

  const alerts = buildExecutionAlerts(
    {
      activationRate: current.activationRate,
      retentionRate: current.retentionRate,
      conversionRate: current.conversionRate,
    },
    {
      activationRate: previous.activationRate,
      retentionRate: previous.retentionRate,
      conversionRate: previous.conversionRate,
    }
  );

  const report = generateDailyExecutionReport({
    current: {
      newUsers: current.newUsers,
      simulatorRuns: current.simulatorRuns,
      activationRate: current.activationRate,
      retentionRate: current.retentionRate,
      conversionRate: current.conversionRate,
    },
    previous: {
      newUsers: previous.newUsers,
      simulatorRuns: previous.simulatorRuns,
      activationRate: previous.activationRate,
      retentionRate: previous.retentionRate,
      conversionRate: previous.conversionRate,
    },
    alerts,
  });

  return { windowDays, current, previous, daily, alerts, report };
}
