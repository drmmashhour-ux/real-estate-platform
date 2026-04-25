import {
  DAILY_SCORE_WEIGHTS,
  DAILY_TARGETS,
  MIDDAY_ALERT_HOUR,
  WEEKLY_TARGETS,
  progressToPace,
  type KpiPace,
} from "./field-kpi.config";

/** Normalized daily + snapshot fields for one agent. */
export type FieldAgentKpiInput = {
  id: string;
  displayName: string;
  code?: string;
  dateKey: string; // YYYY-MM-DD
  callsMade: number;
  dmsOrContacts: number;
  demosBooked: number;
  demosCompleted: number;
  followUps: number;
  /** Same-day or rolling — used in score weight. */
  trialsStarted: number;
  /** Count or rate 0–1; if count, we normalize vs a notional day target. */
  conversions: number;
  /** Optional revenue for manager context (cents). */
  revenueCents: number;
  /** Weekly window (for weekly section). */
  weekBrokersContacted: number;
  weekDemosDone: number;
  weekTrialsStarted: number;
  weekActivated: number;
  weekPaying: number;
};

export type KpiLine = {
  id: string;
  label: string;
  current: number;
  target: number;
  targetLabel: string;
  percent: number;
  pace: KpiPace;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pctOf(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((current / target) * 1000) / 10;
}

const NOTIONAL_TRIALS_PER_DAY = 2;

export function buildDailyKpiLines(input: FieldAgentKpiInput): KpiLine[] {
  const demosBookedTarget = (DAILY_TARGETS.demosBooked.min + DAILY_TARGETS.demosBooked.max) / 2;

  return [
    {
      id: "calls",
      label: "Appels",
      current: input.callsMade,
      target: DAILY_TARGETS.calls,
      targetLabel: String(DAILY_TARGETS.calls),
      percent: pctOf(input.callsMade, DAILY_TARGETS.calls),
      pace: progressToPace(pctOf(input.callsMade, DAILY_TARGETS.calls)),
    },
    {
      id: "dms",
      label: "DM / contacts",
      current: input.dmsOrContacts,
      target: DAILY_TARGETS.dmsOrContacts,
      targetLabel: String(DAILY_TARGETS.dmsOrContacts),
      percent: pctOf(input.dmsOrContacts, DAILY_TARGETS.dmsOrContacts),
      pace: progressToPace(pctOf(input.dmsOrContacts, DAILY_TARGETS.dmsOrContacts)),
    },
    {
      id: "demosBooked",
      label: "Démos bookées",
      current: input.demosBooked,
      target: demosBookedTarget,
      targetLabel: `${DAILY_TARGETS.demosBooked.min}–${DAILY_TARGETS.demosBooked.max}`,
      percent: pctOf(input.demosBooked, demosBookedTarget),
      pace: progressToPace(pctOf(input.demosBooked, demosBookedTarget)),
    },
    {
      id: "demosCompleted",
      label: "Démos complétées",
      current: input.demosCompleted,
      target: DAILY_TARGETS.demosCompleted,
      targetLabel: String(DAILY_TARGETS.demosCompleted),
      percent: pctOf(input.demosCompleted, DAILY_TARGETS.demosCompleted),
      pace: progressToPace(pctOf(input.demosCompleted, DAILY_TARGETS.demosCompleted)),
    },
    {
      id: "followUps",
      label: "Suivis",
      current: input.followUps,
      target: DAILY_TARGETS.followUps,
      targetLabel: String(DAILY_TARGETS.followUps),
      percent: pctOf(input.followUps, DAILY_TARGETS.followUps),
      pace: progressToPace(pctOf(input.followUps, DAILY_TARGETS.followUps)),
    },
  ];
}

/**
 * 0–100 weighted daily score. Conversions & demos carry most weight.
 */
export function computeDailyScore(input: FieldAgentKpiInput): number {
  const w = DAILY_SCORE_WEIGHTS;
  const demosBookedTarget = (DAILY_TARGETS.demosBooked.min + DAILY_TARGETS.demosBooked.max) / 2;

  const cCalls = clamp(input.callsMade / DAILY_TARGETS.calls, 0, 1);
  const cDms = clamp(input.dmsOrContacts / DAILY_TARGETS.dmsOrContacts, 0, 1);
  const cBook = clamp(input.demosBooked / demosBookedTarget, 0, 1);
  const cDone = clamp(input.demosCompleted / DAILY_TARGETS.demosCompleted, 0, 1);
  const cFu = clamp(input.followUps / DAILY_TARGETS.followUps, 0, 1);
  const cTrial = clamp(input.trialsStarted / NOTIONAL_TRIALS_PER_DAY, 0, 1);
  const cConv = typeof input.conversions === "number" && input.conversions <= 1
    ? input.conversions
    : clamp(input.conversions / 3, 0, 1);

  const trialsConvBlend = 0.55 * cTrial + 0.45 * cConv;

  const raw =
    w.calls * cCalls +
    w.dms * cDms +
    w.demosBooked * cBook +
    w.demosCompleted * cDone +
    w.followUps * cFu +
    w.trialsOrConversions * trialsConvBlend;

  return Math.round(raw * 1000) / 10;
}

export type KpiAlert = { id: string; severity: "warning" | "critical"; message: string };

export function computeAlerts(
  input: FieldAgentKpiInput,
  now: Date,
  opts?: { midDayHour?: number },
): KpiAlert[] {
  const mid = opts?.midDayHour ?? MIDDAY_ALERT_HOUR;
  const out: KpiAlert[] = [];
  const h = now.getHours();

  if (h >= mid && input.demosBooked < 1 && input.demosCompleted < 1) {
    out.push({
      id: "no_demos_middays",
      severity: "warning",
      message: "Aucune démo encore — se concentrer sur le booking maintenant.",
    });
  }

  const activity = input.callsMade + input.dmsOrContacts + input.followUps;
  if (h >= mid && activity < 8) {
    out.push({
      id: "low_activity",
      severity: "warning",
      message: "Activité sous le rythme cible pour la fin de matinée.",
    });
  }

  const lines = buildDailyKpiLines(input);
  const criticals = lines.filter((l) => l.pace === "critical");
  if (criticals.length >= 3) {
    out.push({
      id: "multi_critical",
      severity: "critical",
      message: "Plusieurs KPIs critiques aujourd’hui — reprioriser appels + booking démo.",
    });
  }

  return out;
}

export type CoachingInsight = { strength: string; weakness: string };

export function computeCoaching(input: FieldAgentKpiInput, lines: KpiLine[]): CoachingInsight {
  const sorted = [...lines].sort((a, b) => b.percent - a.percent);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const strength =
    best && best.percent >= 70
      ? `Bon sur ${best.label.toLowerCase()} (booking d’énergie ici).`
      : "Bon rythme global — cadrer 2 blocs d’appels before EOD.";

  const weakness =
    worst && worst.percent < 60
      ? `À renforcer: ${worst.label.toLowerCase()} — objectif explicite sur la prochaine demi-journée.`
    : input.conversions < 0.15
      ? "Conversion faible — resserrer la transition démo → essai."
      : "Garder la pression sur démos bookées + complétées.";

  return { strength, weakness };
}

export type LeaderboardEntry = {
  id: string;
  displayName: string;
  demosCompleted: number;
  conversionProxy: number;
  dailyScore: number;
};

export function buildWeeklyKpiLines(input: FieldAgentKpiInput): KpiLine[] {
  const w = WEEKLY_TARGETS;
  const demosMid = (w.demosDone.min + w.demosDone.max) / 2;
  const trialsMid = (w.trialsStarted.min + w.trialsStarted.max) / 2;
  const actMid = (w.activatedBrokers.min + w.activatedBrokers.max) / 2;
  const payMid = (w.payingBrokers.min + w.payingBrokers.max) / 2;

  return [
    {
      id: "w_brokers",
      label: "Courtiers contactés (sem.)",
      current: input.weekBrokersContacted,
      target: w.brokersContacted.min,
      targetLabel: `${w.brokersContacted.min}+`,
      percent: pctOf(input.weekBrokersContacted, w.brokersContacted.min),
      pace: progressToPace(pctOf(input.weekBrokersContacted, w.brokersContacted.min)),
    },
    {
      id: "w_demos",
      label: "Démos réalisées (sem.)",
      current: input.weekDemosDone,
      target: demosMid,
      targetLabel: `${w.demosDone.min}–${w.demosDone.max}`,
      percent: pctOf(input.weekDemosDone, demosMid),
      pace: progressToPace(pctOf(input.weekDemosDone, demosMid)),
    },
    {
      id: "w_trials",
      label: "Essais démarrés (sem.)",
      current: input.weekTrialsStarted,
      target: trialsMid,
      targetLabel: `${w.trialsStarted.min}–${w.trialsStarted.max}`,
      percent: pctOf(input.weekTrialsStarted, trialsMid),
      pace: progressToPace(pctOf(input.weekTrialsStarted, trialsMid)),
    },
    {
      id: "w_act",
      label: "Courtiers activés (sem.)",
      current: input.weekActivated,
      target: actMid,
      targetLabel: `${w.activatedBrokers.min}–${w.activatedBrokers.max}`,
      percent: pctOf(input.weekActivated, actMid),
      pace: progressToPace(pctOf(input.weekActivated, actMid)),
    },
    {
      id: "w_pay",
      label: "Courtiers payants (sem.)",
      current: input.weekPaying,
      target: payMid,
      targetLabel: `${w.payingBrokers.min}–${w.payingBrokers.max}`,
      percent: pctOf(input.weekPaying, payMid),
      pace: progressToPace(pctOf(input.weekPaying, payMid)),
    },
  ];
}

export function buildLeaderboard(inputs: FieldAgentKpiInput[]): LeaderboardEntry[] {
  return inputs
    .map((i) => ({
      id: i.id,
      displayName: i.displayName,
      demosCompleted: i.demosCompleted,
      conversionProxy: typeof i.conversions === "number" && i.conversions <= 1 ? i.conversions : 0.2,
      dailyScore: computeDailyScore(i),
    }))
    .sort(
      (a, b) =>
        b.demosCompleted - a.demosCompleted || b.conversionProxy - a.conversionProxy || b.dailyScore - a.dailyScore,
    );
}
