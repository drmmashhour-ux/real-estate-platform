/** Fixed daily launch targets (First 10 Clients system). */
export const ACQUISITION_DAILY_TARGETS = {
  contacts: 20,
  leads: 5,
  callsBooked: 2,
  clientsClosed: 1,
} as const;

export type AcquisitionDailyTargets = typeof ACQUISITION_DAILY_TARGETS;
