import {
  countDistinctUsersWithEvent,
  countEventsByName,
} from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";

export type GrowthFunnelMetrics = {
  windowDays: number;
  signupStarted: number;
  firstActionCompleted: number;
  simulatorUsed: number;
  scenarioSaved: number;
  returnVisit: number;
  upgradeClicked: number;
  upgradeStarted: number;
  upgradeCompleted: number;
  activationRate: number | null;
  retentionRate: number | null;
  conversionRate: number | null;
};

function rate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 10000) / 100;
}

export async function computeGrowthFunnelMetrics(windowDays = 30): Promise<GrowthFunnelMetrics> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - windowDays);

  const [
    signupUsers,
    firstActionCompleted,
    simulatorUsedUsers,
    scenarioSaved,
    returnVisitUsers,
    upgradeClicked,
    upgradeStarted,
    upgradeCompleted,
  ] = await Promise.all([
    countDistinctUsersWithEvent("signup_started", since),
    countDistinctUsersWithEvent("first_action_completed", since),
    countDistinctUsersWithEvent("simulator_used", since),
    countEventsByName("scenario_saved", since),
    countDistinctUsersWithEvent("return_visit", since),
    countEventsByName("upgrade_clicked", since),
    countEventsByName("upgrade_started", since),
    countEventsByName("upgrade_completed", since),
  ]);

  const activationRate = rate(firstActionCompleted, Math.max(signupUsers, 1));
  const retentionRate = rate(returnVisitUsers, Math.max(simulatorUsedUsers, 1));
  const conversionRate = rate(upgradeCompleted, Math.max(upgradeClicked, 1));

  return {
    windowDays,
    signupStarted: signupUsers,
    firstActionCompleted,
    simulatorUsed: simulatorUsedUsers,
    scenarioSaved,
    returnVisit: returnVisitUsers,
    upgradeClicked,
    upgradeStarted,
    upgradeCompleted,
    activationRate,
    retentionRate,
    conversionRate,
  };
}
