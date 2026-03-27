/**
 * Demo / presentation mode — prioritize stable paths, safe API behavior, and clear copy.
 * Set NEXT_PUBLIC_DEMO_MODE=true (or 1) and optionally DEMO_MODE=1 on the server.
 */

function truthy(v: string | undefined): boolean {
  if (v == null || v === "") return false;
  const t = v.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes";
}

/** Server + client: full demo/safe mode (e.g. Stripe mocked, write guards). */
export function isDemoMode(): boolean {
  if (typeof process === "undefined") return false;
  return truthy(process.env.DEMO_MODE) || truthy(process.env.NEXT_PUBLIC_DEMO_MODE);
}

/** Client-oriented: public demo flag (banners, UI disclaimers). */
export function isPublicDemoMode(): boolean {
  if (typeof process === "undefined") return false;
  return truthy(process.env.NEXT_PUBLIC_DEMO_MODE);
}
