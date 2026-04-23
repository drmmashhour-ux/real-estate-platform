import { API_BASE_URL } from "../config";
import { clearStoredSessionToken, getStoredSessionToken } from "../auth/session";
import type {
  MobileAccount,
  MobileBookingDetail,
  MobileBookingMessage,
  MobileDispute,
  MobileNotification,
  MobileTrip,
} from "../types";

type HttpMethod = "GET" | "POST" | "DELETE";

async function request<T>(path: string, method: HttpMethod = "GET", body?: unknown): Promise<T> {
  const sessionToken = await getStoredSessionToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) message = payload.error;
    } catch {}
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function getMobileTrips() {
  return request<{ user: { id: string; name: string | null; email: string }; trips: MobileTrip[] }>(
    "/api/mobile/bnhub/trips"
  );
}

export function getMobileBooking(bookingId: string) {
  return request<{ booking: MobileBookingDetail }>(`/api/mobile/bnhub/bookings/${bookingId}`);
}

export function getMobileNotifications(unreadOnly = false) {
  return request<{ notifications: MobileNotification[] }>(
    `/api/mobile/bnhub/notifications${unreadOnly ? "?unread=1" : ""}`
  );
}

export function markMobileNotificationsRead(ids: string[]) {
  return request<{ ok: true; updatedCount: number }>("/api/mobile/bnhub/notifications", "POST", { ids });
}

export function markAllMobileNotificationsRead() {
  return request<{ ok: true; updatedCount: number }>("/api/mobile/bnhub/notifications", "POST", {
    markAll: true,
  });
}

export function getMobileAccount() {
  return request<{ account: MobileAccount }>("/api/mobile/bnhub/account/me");
}

export function cancelMobileBooking(bookingId: string) {
  return request<{ booking: { id: string; status: string } }>(
    `/api/mobile/bnhub/bookings/${bookingId}/cancel`,
    "POST",
    { by: "guest" }
  );
}

export function registerMobileDevice(input: {
  token: string;
  platform: "ios" | "android" | "web";
  provider?: "expo" | "fcm" | "apns";
  deviceName?: string | null;
  appVersion?: string | null;
}) {
  return request<{ ok: true }>("/api/mobile/bnhub/devices", "POST", input);
}

export function loginMobile(input: { email: string; password: string }) {
  return request<{
    ok: true;
    sessionToken: string;
    user: MobileAccount;
  }>("/api/mobile/bnhub/auth/login", "POST", input);
}

export function logoutMobile() {
  return request<{ ok: true }>("/api/mobile/bnhub/auth/logout", "POST");
}

export async function clearMobileSession() {
  await clearStoredSessionToken();
}

export function getMobileMessages(bookingId: string) {
  return request<{
    booking: { id: string; listingTitle: string | null };
    messages: MobileBookingMessage[];
  }>(`/api/mobile/bnhub/messages?bookingId=${encodeURIComponent(bookingId)}`);
}

export function sendMobileMessage(input: { bookingId: string; body: string }) {
  return request<{ message: MobileBookingMessage }>("/api/mobile/bnhub/messages", "POST", input);
}

export function getMobileDisputes(bookingId: string) {
  return request<{
    booking: { id: string; listingTitle: string | null };
    disputes: MobileDispute[];
  }>(`/api/mobile/bnhub/disputes?bookingId=${encodeURIComponent(bookingId)}`);
}

export function createMobileDispute(input: {
  bookingId: string;
  description: string;
  complaintCategory?: string | null;
  urgencyLevel?: string | null;
}) {
  return request<{ dispute: MobileDispute }>("/api/mobile/bnhub/disputes", "POST", input);
}
