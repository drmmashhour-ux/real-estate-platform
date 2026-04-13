/**
 * Routes that render {@link ToolShell} with {@link PlatformToolShellHeader} — hide the global marketing header to avoid duplicate logos/bars.
 */
export function isSelfContainedToolChromePath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/financial-hub")) return true;
  if (pathname.startsWith("/tools/")) return true;
  if (pathname.startsWith("/invest/tools")) return true;
  if (pathname.startsWith("/first-home-buyer")) return true;
  return false;
}
