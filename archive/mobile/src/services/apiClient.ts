import { apiFetch } from "./api";

/** Same identity resolution as axios client (`lecipm_mobile_jwt` + Supabase session). */
export async function mobileFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, undefined, init);
}

export { apiFetch };
