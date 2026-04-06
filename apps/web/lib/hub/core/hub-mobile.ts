/**
 * Mobile shell — shared navigation shape for Expo / React Native consumers.
 * Web remains source of truth for routes; apps mirror these keys.
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
