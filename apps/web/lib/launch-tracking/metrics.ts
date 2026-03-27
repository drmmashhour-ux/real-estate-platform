export const LAUNCH_METRIC_KEYS = [
  "messagesSent",
  "repliesReceived",
  "demosBooked",
  "demosCompleted",
  "usersCreated",
  "activatedUsers",
  "payingUsers",
  "postsCreated",
  "contentViews",
  "contentClicks",
  "contentConversions",
] as const;

export type LaunchMetricKey = (typeof LAUNCH_METRIC_KEYS)[number];

export function isLaunchMetricKey(s: string): s is LaunchMetricKey {
  return (LAUNCH_METRIC_KEYS as readonly string[]).includes(s);
}

export type LaunchDailyRow = {
  date: string;
  messagesSent: number;
  repliesReceived: number;
  demosBooked: number;
  demosCompleted: number;
  usersCreated: number;
  activatedUsers: number;
  payingUsers: number;
  postsCreated: number;
  contentViews: number;
  contentClicks: number;
  contentConversions: number;
};

export function emptyTotals(): Record<LaunchMetricKey, number> {
  return {
    messagesSent: 0,
    repliesReceived: 0,
    demosBooked: 0,
    demosCompleted: 0,
    usersCreated: 0,
    activatedUsers: 0,
    payingUsers: 0,
    postsCreated: 0,
    contentViews: 0,
    contentClicks: 0,
    contentConversions: 0,
  };
}
