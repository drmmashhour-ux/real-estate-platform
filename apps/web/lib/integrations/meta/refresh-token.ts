/**
 * Refresh / extend Meta long-lived tokens (official Graph endpoints).
 */

import { graphGet } from "./graph-client";

export type DebugTokenInfo = {
  data?: {
    app_id?: string;
    type?: string;
    application?: string;
    expires_at?: number;
    is_valid?: boolean;
    scopes?: string[];
    user_id?: string;
  };
};

/**
 * Inspect token validity and expiry (app access token = app_id|client_secret).
 */
export async function debugAccessToken(inputToken: string): Promise<DebugTokenInfo> {
  const appId = process.env.META_APP_ID?.trim();
  const secret = process.env.META_APP_SECRET?.trim();
  if (!appId || !secret) throw new Error("META_APP_ID / META_APP_SECRET not configured");
  const appAccessToken = `${appId}|${secret}`;
  return graphGet<DebugTokenInfo>("/debug_token", appAccessToken, {
    input_token: inputToken,
  });
}

/**
 * Returns true if token is missing expiry or expires within `withinMs`.
 */
export function isTokenNearingExpiry(expiresAt: Date | null | undefined, withinMs: number): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() - Date.now() < withinMs;
}
