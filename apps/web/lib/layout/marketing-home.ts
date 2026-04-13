import { appPathnameFromUrl } from "@/i18n/pathname";

/** Locale+country root (`/en/ca`) — hero + listings + trust only; strip global hub clutter. */
export function isMarketingHomePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return appPathnameFromUrl(pathname) === "/";
}
