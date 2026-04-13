/**
 * Shared Meta Graph API fetch helper (Instagram / Facebook).
 * @see https://developers.facebook.com/docs/graph-api
 */

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION?.trim() || "v21.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function graphApiUrl(path: string, params?: Record<string, string>): string {
  const u = new URL(`${BASE}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) u.searchParams.set(k, v);
    }
  }
  return u.toString();
}

export type GraphErrorBody = { error?: { message?: string; code?: number; error_subcode?: number } };

export async function graphGet<T>(path: string, accessToken: string, params?: Record<string, string>): Promise<T> {
  const url = graphApiUrl(path, { ...params, access_token: accessToken });
  const res = await fetch(url, { method: "GET", next: { revalidate: 0 } });
  const json = (await res.json()) as T & GraphErrorBody;
  if (!res.ok || (json as GraphErrorBody).error) {
    const msg = (json as GraphErrorBody).error?.message ?? res.statusText;
    throw new Error(`Meta Graph GET ${path}: ${msg}`);
  }
  return json;
}

export async function graphPostForm<T>(
  path: string,
  accessToken: string,
  body: Record<string, string>
): Promise<T> {
  const url = graphApiUrl(path);
  const form = new URLSearchParams({ ...body, access_token: accessToken });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const json = (await res.json()) as T & GraphErrorBody;
  if (!res.ok || (json as GraphErrorBody).error) {
    const msg = (json as GraphErrorBody).error?.message ?? res.statusText;
    throw new Error(`Meta Graph POST ${path}: ${msg}`);
  }
  return json;
}
