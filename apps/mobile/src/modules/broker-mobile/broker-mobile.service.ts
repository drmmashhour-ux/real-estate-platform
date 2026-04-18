import { mobileFetch } from "../../services/apiClient";
import type { MobileBrokerActionsResponse, MobileBrokerHomeResponse } from "./broker-mobile.types";

export async function fetchBrokerMobileHome(): Promise<MobileBrokerHomeResponse> {
  return mobileFetch<MobileBrokerHomeResponse>("/api/mobile/broker/home");
}

export async function fetchBrokerActions(): Promise<MobileBrokerActionsResponse> {
  return mobileFetch<MobileBrokerActionsResponse>("/api/mobile/broker/actions");
}

export async function completeBrokerAction(actionId: string): Promise<unknown> {
  const enc = encodeURIComponent(actionId);
  return mobileFetch(`/api/mobile/broker/actions/${enc}/complete`, { method: "POST" });
}

export async function snoozeBrokerAction(actionId: string, untilIso: string): Promise<unknown> {
  const enc = encodeURIComponent(actionId);
  return mobileFetch(`/api/mobile/broker/actions/${enc}/snooze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ until: untilIso }),
  });
}

export async function registerBrokerPushToken(body: Record<string, unknown>): Promise<unknown> {
  return mobileFetch("/api/mobile/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
