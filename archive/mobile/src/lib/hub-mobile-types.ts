/**
 * Mobile hub shell — keep in sync with `apps/web/lib/hub/core/hub-mobile.ts` types.
 * Web remains canonical for routes; Expo uses the same hubKey + tab labels.
 */
export type MobileHubTab = {
  hubKey: string;
  labelKey: string;
  path: string;
  icon: string;
};

export type MobileHubShellConfig = {
  hubKey: string;
  tabs: MobileHubTab[];
  accentHex: string;
  backgroundHex: string;
};
