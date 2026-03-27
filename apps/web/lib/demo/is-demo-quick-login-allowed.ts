/**
 * One-click demo login (POST /api/auth/demo-login) and related UI.
 * Allowed when staging, or when DEMO_MODE / NEXT_PUBLIC_DEMO_MODE is set (including production investor demos).
 */
export function isDemoQuickLoginAllowed(): boolean {
  const demo =
    process.env.DEMO_MODE === "1" ||
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (demo) return true;
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_ENV === "staging";
}
