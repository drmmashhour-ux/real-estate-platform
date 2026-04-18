/**
 * Supabase integration status for /api/health (no secrets logged).
 */
export type SupabaseHealth = {
  config: "configured" | "not_configured";
  /** Present only when `deep` probe runs and config exists. */
  reachability?: "reachable" | "degraded";
};

export function supabaseConfigStatus(): "configured" | "not_configured" {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && anon ? "configured" : "not_configured";
}

export async function getSupabaseHealth(deep: boolean): Promise<SupabaseHealth> {
  const config = supabaseConfigStatus();
  if (!deep || config === "not_configured") {
    return { config };
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim().replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 2500);
    const r = await fetch(`${base}/auth/v1/health`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      signal: ac.signal,
    });
    clearTimeout(t);
    return { config, reachability: r.ok ? "reachable" : "degraded" };
  } catch {
    return { config, reachability: "degraded" };
  }
}
