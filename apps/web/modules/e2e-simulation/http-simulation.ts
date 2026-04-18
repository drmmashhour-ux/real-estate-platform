import type { SimulationRunContext } from "./e2e-simulation.types";

export function localizedPath(ctx: SimulationRunContext, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `/${ctx.locale}/${ctx.country}${p}`;
}

export function fullUrl(ctx: SimulationRunContext, path: string): string {
  const base = ctx.baseUrl.replace(/\/$/, "");
  if (path.startsWith("http")) return path;
  return `${base}${localizedPath(ctx, path)}`;
}

export function apiUrl(ctx: SimulationRunContext, apiPath: string): string {
  const base = ctx.baseUrl.replace(/\/$/, "");
  const p = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  return `${base}${p}`;
}

export async function fetchEvidence(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; snippet: string }> {
  const ctrl =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(20_000) : undefined;
  try {
    const res = await fetch(url, { ...init, signal: init?.signal ?? ctrl });
    const text = await res.text();
    const snippet = text.slice(0, 280).replace(/\s+/g, " ");
    return { ok: res.ok, status: res.status, snippet };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, snippet: msg.slice(0, 280) };
  }
}
