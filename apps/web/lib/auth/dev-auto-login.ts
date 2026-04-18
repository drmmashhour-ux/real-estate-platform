/**
 * Local validation only — never enable DEV_AUTO_LOGIN in production.
 */
export function isDevAutoLoginBypass(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_AUTO_LOGIN === "true";
}
