export type ShareSessionInfo = {
  id: string;
  status: "ACTIVE" | "PAUSED" | "STOPPED" | "EXPIRED";
  shareType: "LIVE_LOCATION" | "STAY_STATUS_ONLY";
  expiresAt: string;
  startedAt: string;
  displayLabel: string | null;
  recipientType: string | null;
  lastLocationAt: string | null;
  shareUrlHint?: string;
};

export type DurationChoice = "1h" | "8h" | "until_checkin" | "until_checkout";
export type ModeChoice = "live_location" | "stay_status_only";
export type ShareMethodChoice = "email" | "link";
export type ExtendPreset = "1h" | "8h" | "until_checkout";

export const TOKEN_PREFIX = "share_session_token_";
