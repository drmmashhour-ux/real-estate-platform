export type MobileBrokerHomeResponse = {
  kind: "mobile_broker_home_v1";
  topActions: unknown[];
  stats: { activeResidentialDeals: number; unreadBrokerMobileNotifications: number };
  quickLinks: Record<string, string>;
};

export type MobileBrokerActionsResponse = {
  kind: "mobile_broker_actions_v1";
  feed: {
    mustDoNow: unknown[];
    doToday: unknown[];
    doThisWeek: unknown[];
    all: unknown[];
  };
};
