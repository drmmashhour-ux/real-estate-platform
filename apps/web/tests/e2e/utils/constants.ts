/** Default locale/country segment for LECIPM i18n routes. */
export const E2E_LOCALE_PATH = process.env.E2E_LOCALE_PATH?.trim() || "/en/ca";

export function e2ePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${E2E_LOCALE_PATH}${p}`;
}
