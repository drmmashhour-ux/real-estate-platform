import { apiFetch } from "./api";

export type RegisterPushTokenBody = {
  token: string;
  platform: string;
  provider?: string;
  deviceName?: string | null;
  appVersion?: string | null;
};

export async function registerPushToken(body: RegisterPushTokenBody): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/api/mobile/notifications/register-token", undefined, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
