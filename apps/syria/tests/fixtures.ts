/** Default locale for smoke tests (matches `routing.defaultLocale`). */
export const E2E_LOCALE = process.env.PLAYWRIGHT_LOCALE ?? "ar";

export function localePath(pathSegment: string): string {
  const p = pathSegment.startsWith("/") ? pathSegment : `/${pathSegment}`;
  return `/${E2E_LOCALE}${p}`;
}
