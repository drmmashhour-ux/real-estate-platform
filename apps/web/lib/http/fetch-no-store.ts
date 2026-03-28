/**
 * Server Components: use instead of bare `fetch` so Next never caches the response across auth boundaries.
 * Client Components: optional; avoids browser HTTP cache surprises for same-origin API calls.
 */
export function fetchNoStore(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, cache: "no-store" });
}
