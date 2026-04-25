/**
 * Future integration: replace `getAgentKpiForToday` with:
 * - outreach / CRM: calls, DMs, contacts, follow-ups
 * - demo scheduling: bookings + completions
 * - trial & billing: trials started, activated, paying, revenue
 *
 * V1: mock + optional extension from internal APIs.
 */

import type { FieldAgentKpiInput } from "./field-kpi.engine";

const todayKey = () => new Date().toISOString().slice(0, 10);

/** Single-agent demo snapshot for the field dashboard. */
export function getMockFieldAgentKpi(): FieldAgentKpiInput {
  return {
    id: "self",
    displayName: "Votre compte (démo)",
    code: "FLD-ME",
    dateKey: todayKey(),
    callsMade: 4,
    dmsOrContacts: 6,
    demosBooked: 1,
    demosCompleted: 0,
    followUps: 2,
    trialsStarted: 0,
    conversions: 0.08,
    revenueCents: 0,
    weekBrokersContacted: 32,
    weekDemosDone: 8,
    weekTrialsStarted: 2,
    weekActivated: 1,
    weekPaying: 0,
  };
}

export function getMockManagerAgents(): FieldAgentKpiInput[] {
  const d = todayKey();
  return [
    {
      id: "a1",
      displayName: "Maya R.",
      code: "FLD-01",
      dateKey: d,
      callsMade: 8,
      dmsOrContacts: 9,
      demosBooked: 2,
      demosCompleted: 2,
      followUps: 4,
      trialsStarted: 1,
      conversions: 0.22,
      revenueCents: 45_000,
      weekBrokersContacted: 55,
      weekDemosDone: 16,
      weekTrialsStarted: 6,
      weekActivated: 4,
      weekPaying: 2,
    },
    {
      id: "a2",
      displayName: "Alex T.",
      code: "FLD-02",
      dateKey: d,
      callsMade: 6,
      dmsOrContacts: 5,
      demosBooked: 1,
      demosCompleted: 1,
      followUps: 2,
      trialsStarted: 0,
      conversions: 0.11,
      revenueCents: 15_000,
      weekBrokersContacted: 44,
      weekDemosDone: 12,
      weekTrialsStarted: 3,
      weekActivated: 2,
      weekPaying: 1,
    },
    {
      id: "a3",
      displayName: "Sam K.",
      code: "FLD-03",
      dateKey: d,
      callsMade: 2,
      dmsOrContacts: 2,
      demosBooked: 0,
      demosCompleted: 0,
      followUps: 1,
      trialsStarted: 0,
      conversions: 0.04,
      revenueCents: 0,
      weekBrokersContacted: 18,
      weekDemosDone: 4,
      weekTrialsStarted: 1,
      weekActivated: 0,
      weekPaying: 0,
    },
  ];
}

/**
 * E.g. return await prisma.fieldAgentKpi.findMany({ where: { date: today } })
 * until then, mock.
 */
export async function getFieldKpiForCurrentAgent(): Promise<FieldAgentKpiInput> {
  return getMockFieldAgentKpi();
}
