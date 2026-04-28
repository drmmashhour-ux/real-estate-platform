/**
 * Query parsing for paginated stay browse APIs (`/api/lite/listings`, `/api/sybnb/listings`).
 */

export type PagedListQuery = {
  page: number;
  limit: number;
  locale: "ar" | "en";
};

const MAX_LIMIT = 10;

/** ORDER SYBNB-FINAL — lite browse APIs match marketplace grid cap (max rows per page). */
export function clampPage(n: number): number {
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/** Default 10; `density=lite` → 5; `density=rich` prefers more rows but caps at MAX_LIMIT (SYBNB-FINAL). */
export function parsePagedListQuery(requestUrl: string): PagedListQuery {
  const url = new URL(requestUrl);
  const rawPage = parseInt(url.searchParams.get("page") || "1", 10);
  const page = clampPage(rawPage);

  const explicit = url.searchParams.get("limit");
  const density = url.searchParams.get("density")?.toLowerCase();

  let limit = 10;
  if (density === "lite") limit = 5;
  else if (density === "rich") limit = 12;

  limit = Math.min(limit, MAX_LIMIT);

  if (explicit != null && explicit.trim() !== "") {
    const n = parseInt(explicit, 10);
    if (Number.isFinite(n) && n >= 1) {
      limit = Math.min(n, MAX_LIMIT);
    }
  }

  const localeRaw = url.searchParams.get("locale")?.trim().slice(0, 8);
  const locale: "ar" | "en" =
    localeRaw === "en" || localeRaw === "ar" ? localeRaw : "ar";

  return { page, limit, locale };
}

export function firstPageCacheKey(locale: string): string {
  return `syria_lite:listings:firstPage:v1:${locale}`;
}
