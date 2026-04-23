import axios, { type AxiosInstance } from "axios";
import { API_BASE_URL } from "../lib/env";
import { supabase } from "../lib/supabase";
import { clearStoredAccessToken, getStoredAccessToken, persistAccessToken } from "./auth";

const baseURL = API_BASE_URL.replace(/\/$/, "");

async function resolveBearer(): Promise<string | null> {
  const stored = await getStoredAccessToken();
  if (stored) return stored;
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  if (t) await persistAccessToken(t);
  return t ?? null;
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: { Accept: "application/json" },
    timeout: 30_000,
  });
  client.interceptors.request.use(async (config) => {
    const token = await resolveBearer();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const d = err.response.data as Record<string, unknown>;
        const msg =
          typeof d.error === "string"
            ? d.error
            : typeof d.message === "string"
              ? d.message
              : Array.isArray(d.errors) && typeof d.errors[0] === "string"
                ? d.errors[0]
                : null;
        if (msg) return Promise.reject(new Error(msg));
      }
      return Promise.reject(err instanceof Error ? err : new Error(String(err)));
    }
  );
  return client;
}

export const lecipmApi = createApiClient();
const client = lecipmApi;

/**
 * Lightweight `fetch` wrapper aligned with Bearer auth used by `/api/mobile/**`.
 * @param token Pass a string to force that JWT; `undefined` resolves stored session / Supabase; `null` sends no Authorization header (public endpoints).
 */
export async function apiFetch<T>(
  path: string,
  token?: string | null,
  init?: RequestInit,
): Promise<T> {
  let bearer: string | null = null;
  if (token === undefined) bearer = await resolveBearer();
  else if (typeof token === "string" && token.length > 0) bearer = token;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const url = `${baseURL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    let msg = text || res.statusText;
    try {
      const j = JSON.parse(text) as Record<string, unknown>;
      const e =
        typeof j.error === "string"
          ? j.error
          : typeof j.message === "string"
            ? j.message
            : null;
      if (e) msg = e;
    } catch {
      /* keep raw */
    }
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json() as Promise<T>;
}

export type PublicListingCard = {
  id: string;
  title: string;
  city: string;
  nightPriceCents: number;
  currency: string;
  photos?: string[];
  maxGuests?: number;
};

export type ListingsSearchResponse = { listings: PublicListingCard[]; total: number };

export type ListingDetailsResponse = {
  listing: PublicListingCard & {
    region?: string | null;
    country?: string | null;
    beds?: number | null;
    baths?: number | null;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    minStayNights?: number | null;
    houseRules?: string | null;
  };
  reviews?: unknown[];
  similar?: PublicListingCard[];
};

export type CreateBookingBody = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guestNotes?: string;
};

export type CreateBookingResponse = { booking: { id: string; status: string } };

export async function getListings(params?: Record<string, string>): Promise<ListingsSearchResponse> {
  const q = new URLSearchParams(params ?? {});
  const path = q.toString() ? `/api/mobile/v1/listings/search?${q}` : "/api/mobile/v1/listings/search";
  const { data } = await client.get<ListingsSearchResponse>(path);
  return data;
}

export async function getListing(id: string): Promise<ListingDetailsResponse> {
  const { data } = await client.get<ListingDetailsResponse>(`/api/mobile/v1/listings/${id}`);
  return data;
}

export async function createBooking(body: CreateBookingBody): Promise<CreateBookingResponse> {
  const { data } = await client.post<CreateBookingResponse>("/api/mobile/v1/bookings", body);
  return data;
}

export type LoginResult = { ok: true; userId: string; email: string | null } | { ok: false; error: string };

/** Uses Supabase Auth (same identity as `/api/mobile/v1/*` Bearer checks). */
export async function login(email: string, password: string): Promise<LoginResult> {
  if (!supabase) return { ok: false, error: "Auth not configured" };
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.session) {
    return { ok: false, error: error?.message ?? "Sign-in failed" };
  }
  await persistAccessToken(data.session.access_token);
  return { ok: true, userId: data.user.id, email: data.user.email ?? null };
}

export type SignupResult =
  | { ok: true; userId: string; email: string | null; needsEmailConfirm: boolean }
  | { ok: false; error: string };

export async function signup(email: string, password: string): Promise<SignupResult> {
  if (!supabase) return { ok: false, error: "Auth not configured" };
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) return { ok: false, error: error.message };
  const user = data.user;
  if (!user) return { ok: false, error: "Sign-up failed" };
  const needsEmailConfirm = !data.session;
  if (data.session?.access_token) await persistAccessToken(data.session.access_token);
  return { ok: true, userId: user.id, email: user.email ?? null, needsEmailConfirm };
}

export async function logoutApi(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
  await clearStoredAccessToken();
}
